package com.hbdt.subscription.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.ServiceInvoice;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.BusinessProfileRepository;
import com.hbdt.repository.PaymentHistoryRepository;
import com.hbdt.repository.ServiceInvoiceRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class SubscriptionService implements ISubscriptionService {

    private static final String MONTHLY = "MONTHLY";
    private static final String YEARLY = "YEARLY";
    private static final String PAYMENT_PENDING = "PENDING";
    private static final String PAYMENT_COMPLETED = "COMPLETED";
    private static final String PAYMENT_FAILED = "FAILED";
    private static final Set<SubscriptionStatus> OPEN_STATUSES = Set.of(
            SubscriptionStatus.PENDING_PAYMENT,
            SubscriptionStatus.ACTIVE
    );

    private final SubscriptionRepository subscriptionRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final ServiceInvoiceRepository serviceInvoiceRepository;
    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               BusinessProfileRepository businessProfileRepository,
                               PaymentHistoryRepository paymentHistoryRepository,
                               ServiceInvoiceRepository serviceInvoiceRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.businessProfileRepository = businessProfileRepository;
        this.paymentHistoryRepository = paymentHistoryRepository;
        this.serviceInvoiceRepository = serviceInvoiceRepository;
    }

    @Override
    public Subscription createPendingPaymentSubscription(User owner,
                                                          SubscriptionPlan plan,
                                                          String billingCycle,
                                                          LocalDate startDate,
                                                          LocalDate endDate) {
        Long businessId = requireBusinessId(owner);
        validatePlan(plan);
        String normalizedCycle = normalizeBillingCycle(billingCycle);
        validateDates(startDate, endDate);

        businessProfileRepository.findByIdForUpdate(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with id: " + businessId));

        if (subscriptionRepository.existsByBusinessIdAndStatusIn(businessId, OPEN_STATUSES)) {
            throw new IllegalStateException("Tài khoản đang có subscription đang mở (PENDING_PAYMENT hoặc ACTIVE). Vui lòng hủy subscription hiện tại trước khi tạo mới.");
        }

        Subscription subscription = Subscription.builder()
                .userId(owner.getId())
                .businessId(businessId)
                .plan(plan)
                .billingCycle(normalizedCycle)
                .startDate(startDate)
                .endDate(endDate)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();
        return subscriptionRepository.save(subscription);
    }

    @Override
    public Subscription activateSubscription(Long id) {
        Subscription subscription = findSubscription(id);
        activate(subscription, LocalDate.now());
        return subscriptionRepository.save(subscription);
    }

    @Override
    public PaymentHistory createSubscriptionPayment(Long subscriptionId,
                                                     BigDecimal amount,
                                                     String paymentMethod) {
        Subscription subscription = findSubscriptionForUpdate(subscriptionId);
        if (subscription.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Chỉ có thể thanh toán các subscription có trạng thái PENDING_PAYMENT. Trạng thái hiện tại: "
                    + subscription.getStatus());
        }
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0đ");
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new IllegalArgumentException("Phương thức thanh toán không được để trống");
        }

        BigDecimal expectedAmount = expectedAmount(subscription);
        if (amount.compareTo(expectedAmount) != 0) {
            throw new IllegalArgumentException("Số tiền thanh toán không khớp với gói subscription đã chọn");
        }
        if (paymentHistoryRepository.existsBySubscriptionIdAndStatus(subscriptionId, PAYMENT_PENDING)) {
            throw new IllegalStateException("Đã tồn tại một khoản thanh toán đang chờ xử lý cho subscription này");
        }

        PaymentHistory payment = PaymentHistory.builder()
                .transactionId("SUB-PAY-" + UUID.randomUUID())
                .subscriptionId(subscription.getId())
                .amount(amount)
                .paymentMethod(paymentMethod.trim().toUpperCase(Locale.ROOT))
                .status(PAYMENT_PENDING)
                .build();
        return paymentHistoryRepository.save(payment);
    }

    @Override
    public void processPaymentCallback(String transactionId, String paymentStatus) {
        if (transactionId == null || transactionId.isBlank()) {
            throw new IllegalArgumentException("Transaction ID must not be blank");
        }
        String normalizedStatus = paymentStatus == null
                ? ""
                : paymentStatus.trim().toUpperCase(Locale.ROOT);
        boolean successful = "SUCCESS".equals(normalizedStatus) || PAYMENT_COMPLETED.equals(normalizedStatus);
        boolean failed = PAYMENT_FAILED.equals(normalizedStatus) || "CANCELLED".equals(normalizedStatus);
        if (!successful && !failed) {
            throw new IllegalArgumentException("Unsupported payment status: " + paymentStatus);
        }

        PaymentHistory payment = paymentHistoryRepository.findByTransactionIdForUpdate(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment history not found with transactionId: " + transactionId));

        if (!PAYMENT_PENDING.equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalStateException("Chỉ có thể xử lý các khoản thanh toán đang chờ xử lý. Trạng thái hiện tại: " + payment.getStatus());
        }

        if (failed) {
            payment.setStatus(PAYMENT_FAILED);
            paymentHistoryRepository.save(payment);
            return;
        }

        Subscription subscription = findSubscription(payment.getSubscriptionId());

        activate(subscription, LocalDate.now());
        payment.setStatus(PAYMENT_COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
        paymentHistoryRepository.save(payment);

        if (serviceInvoiceRepository.findBySubscriptionId(subscription.getId()).isEmpty()) {
            User invoiceUser = new User();
            invoiceUser.setId(subscription.getUserId());
            ServiceInvoice invoice = ServiceInvoice.builder()
                    .invoiceCode("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT))
                    .user(invoiceUser)
                    .subscription(subscription)
                    .plan(subscription.getPlan())
                    .duration("YEARLY".equals(subscription.getBillingCycle()) ? 12 : 1)
                    .unitPrice(payment.getAmount())
                    .totalAmount(payment.getAmount())
                    .status("PAID")
                    .build();
            serviceInvoiceRepository.save(invoice);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSubscriptionValid(Subscription subscription) {
        if (subscription == null
                || subscription.getStatus() != SubscriptionStatus.ACTIVE
                || subscription.getStartDate() == null
                || subscription.getEndDate() == null) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return !subscription.getStartDate().isAfter(today)
                && !subscription.getEndDate().isBefore(today);
    }

    @Override
    @Transactional(readOnly = true)
    public void validateSubscriptionUsage(Subscription subscription) {
        if (subscription == null) {
            throw new IllegalStateException("No subscription found. Service access rejected.");
        }
        switch (subscription.getStatus()) {
            case PENDING_PAYMENT -> throw new IllegalStateException(
                    "Subscription is pending payment. Service access restricted.");
            case EXPIRED -> throw new IllegalStateException(
                    "Subscription has expired. Service access rejected.");
            case CANCELLED -> throw new IllegalStateException(
                    "Subscription has been cancelled. Service access rejected.");
            case ACTIVE -> {
                if (!isSubscriptionValid(subscription)) {
                    throw new IllegalStateException(
                            "Subscription is invalid or outside active dates. Service access rejected.");
                }
            }
        }
    }

    @Override
    public Subscription getCurrentSubscription(User owner) {
        Long businessId = requireBusinessId(owner);
        LocalDate today = LocalDate.now();
        Subscription active = subscriptionRepository
                .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, SubscriptionStatus.ACTIVE)
                .orElse(null);

        if (active != null && active.getEndDate() != null && active.getEndDate().isBefore(today)) {
            active.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(active);
            active = null;
        }
        if (active != null) {
            return active;
        }

        return subscriptionRepository.findTopByBusinessIdOrderByCreatedAtDesc(businessId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No subscription found for the current business"));
    }

    @Override
    @Transactional(readOnly = true)
    public Subscription getSubscriptionById(Long id, User owner) {
        Subscription subscription = findSubscription(id);
        Long businessId = requireBusinessId(owner);
        if (!businessId.equals(subscription.getBusinessId())) {
            throw new AccessDeniedException("You do not own this subscription");
        }
        return subscription;
    }

    @Override
    public Subscription cancelSubscription(Long id, User owner, String reason) {
        Subscription subscription = getSubscriptionById(id, owner);
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE
                && subscription.getEndDate() != null
                && subscription.getEndDate().isBefore(LocalDate.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            throw new IllegalStateException("Expired subscriptions cannot be cancelled");
        }
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE subscriptions can be cancelled. Current status: "
                    + subscription.getStatus());
        }

        subscription.cancel(reason, LocalDateTime.now());
        return subscriptionRepository.save(subscription);
    }

    @Override
    @Scheduled(cron = "${app.subscription.expiration-cron:0 0 0 * * *}")
    public void checkAndExpireSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findAllByStatusAndEndDateBefore(
                SubscriptionStatus.ACTIVE, LocalDate.now());
        expired.forEach(subscription -> subscription.setStatus(SubscriptionStatus.EXPIRED));
        subscriptionRepository.saveAll(expired);
    }

    private void activate(Subscription subscription, LocalDate activationDate) {
        if (subscription.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Only PENDING_PAYMENT subscriptions can be activated. Current status: "
                    + subscription.getStatus());
        }
        validatePlan(subscription.getPlan());
        String cycle = normalizeBillingCycle(subscription.getBillingCycle());
        subscription.setBillingCycle(cycle);
        subscription.setStartDate(activationDate);
        subscription.setEndDate(activationDate.plusMonths(YEARLY.equals(cycle) ? 12 : 1));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
    }

    private Subscription findSubscription(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Subscription ID must not be null");
        }
        return subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));
    }

    private Subscription findSubscriptionForUpdate(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Subscription ID must not be null");
        }
        return subscriptionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));
    }

    private Long requireBusinessId(User owner) {
        if (owner == null || owner.getBusinessId() == null) {
            throw new IllegalArgumentException("Owner must belong to a business");
        }
        return owner.getBusinessId();
    }

    private void validatePlan(SubscriptionPlan plan) {
        if (plan == null || plan.getId() == null) {
            throw new IllegalArgumentException("Subscription plan must not be null");
        }
        if (!"ACTIVE".equalsIgnoreCase(plan.getStatus())) {
            throw new IllegalStateException("Subscription plan is not active");
        }
    }

    private String normalizeBillingCycle(String billingCycle) {
        String normalized = billingCycle == null ? "" : billingCycle.trim().toUpperCase(Locale.ROOT);
        if (!MONTHLY.equals(normalized) && !YEARLY.equals(normalized)) {
            throw new IllegalArgumentException("Billing cycle must be MONTHLY or YEARLY");
        }
        return normalized;
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || !startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }
    }

    private BigDecimal expectedAmount(Subscription subscription) {
        String cycle = normalizeBillingCycle(subscription.getBillingCycle());
        BigDecimal amount = YEARLY.equals(cycle)
                ? subscription.getPlan().getAnnualPrice()
                : subscription.getPlan().getMonthlyPrice();
        if (amount == null || amount.signum() < 0) {
            throw new IllegalStateException("Subscription plan price is invalid");
        }
        return amount;
    }
}
