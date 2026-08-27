package com.hbdt.subscription.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.PaymentHistory;
import com.hbdt.entity.ServiceInvoice;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.PaymentHistoryRepository;
import com.hbdt.repository.ServiceInvoiceRepository;
import com.hbdt.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SubscriptionService implements ISubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final ServiceInvoiceRepository serviceInvoiceRepository;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                               PaymentHistoryRepository paymentHistoryRepository,
                               ServiceInvoiceRepository serviceInvoiceRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.paymentHistoryRepository = paymentHistoryRepository;
        this.serviceInvoiceRepository = serviceInvoiceRepository;
    }

    /**
     * Tạo Subscription với status PENDING_PAYMENT.
     * Validate:
     * - start_date < end_date
     */
    public Subscription createPendingPaymentSubscription(User owner, SubscriptionPlan plan, String billingCycle, LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date must not be null");
        }
        if (!startDate.isBefore(endDate)) {
            throw new IllegalArgumentException("Start date must be before end date");
        }

        Subscription subscription = Subscription.builder()
                .owner(owner)
                .plan(plan)
                .billingCycle(billingCycle)
                .startDate(startDate)
                .endDate(endDate)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        return subscriptionRepository.save(subscription);
    }

    /**
     * Kích hoạt subscription sau khi thanh toán thành công.
     * Transition: PENDING_PAYMENT -> ACTIVE
     */
    public Subscription activateSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new com.hbdt.common.exception.ResourceNotFoundException("Subscription not found with id: " + id));

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        
        // Cập nhật startDate và endDate khi kích hoạt
        LocalDateTime now = LocalDateTime.now();
        subscription.setStartDate(now);
        int months = "YEARLY".equalsIgnoreCase(subscription.getBillingCycle()) ? 12 : 1;
        subscription.setEndDate(now.plusMonths(months));

        return subscriptionRepository.save(subscription);
    }

    /**
     * Tạo yêu cầu thanh toán (Payment) cho một Subscription.
     * Subscription phải đang ở trạng thái PENDING_PAYMENT.
     */
    public PaymentHistory createSubscriptionPayment(Long subscriptionId, BigDecimal amount, String paymentMethod) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new com.hbdt.common.exception.ResourceNotFoundException("Subscription not found with id: " + subscriptionId));

        if (subscription.getStatus() != SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Only PENDING_PAYMENT subscriptions can be paid. Current status: " + subscription.getStatus());
        }

        String transactionId = "SUB-PAY-" + UUID.randomUUID().toString();

        PaymentHistory paymentHistory = PaymentHistory.builder()
                .transactionId(transactionId)
                .subscriptionId(subscriptionId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .status("PENDING")
                .build();

        return paymentHistoryRepository.save(paymentHistory);
    }

    /**
     * Xử lý kết quả thanh toán từ callback/ipn.
     * Cập nhật trạng thái PaymentHistory và kích hoạt Subscription nếu thành công.
     */
    public void processPaymentCallback(String transactionId, String paymentStatus) {
        PaymentHistory paymentHistory = paymentHistoryRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new com.hbdt.common.exception.ResourceNotFoundException("Payment history not found with transactionId: " + transactionId));

        // Duplicate Protection: check if already processed (COMPLETED or FAILED)
        if (!"PENDING".equalsIgnoreCase(paymentHistory.getStatus())) {
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(paymentStatus) || "COMPLETED".equalsIgnoreCase(paymentStatus)) {
            paymentHistory.setStatus("COMPLETED");
            paymentHistory.setPaidAt(LocalDateTime.now());
            paymentHistoryRepository.save(paymentHistory);

            // Kích hoạt Subscription
            Subscription subscription = activateSubscription(paymentHistory.getSubscriptionId());

            // Xác định businessId
            Long businessId = 0L;
            if (subscription.getOwner() != null && subscription.getOwner().getBusinessId() != null) {
                businessId = subscription.getOwner().getBusinessId();
            }

            // Tạo ServiceInvoice
            ServiceInvoice serviceInvoice = ServiceInvoice.builder()
                    .invoiceNo("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .businessId(businessId)
                    .subscriptionId(subscription.getId())
                    .amount(paymentHistory.getAmount())
                    .status("PAID")
                    .dueDate(LocalDateTime.now())
                    .build();
            serviceInvoiceRepository.save(serviceInvoice);
        } else {
            paymentHistory.setStatus("FAILED");
            paymentHistoryRepository.save(paymentHistory);
        }
    }

    /**
     * Kiểm tra Subscription còn hiệu lực.
     */
    public boolean isSubscriptionValid(Subscription subscription) {
        if (subscription == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return subscription.getStatus() == SubscriptionStatus.ACTIVE
                && !subscription.getStartDate().isAfter(now)
                && (subscription.getEndDate() == null || !subscription.getEndDate().isBefore(now));
    }

    /**
     * Kiểm tra trạng thái và ném ngoại lệ nếu subscription không cho phép sử dụng dịch vụ.
     * ACTIVE -> cho phép sử dụng.
     * PENDING_PAYMENT -> giới hạn quyền / từ chối sử dụng.
     * EXPIRED -> từ chối sử dụng.
     * CANCELLED -> từ chối sử dụng.
     */
    public void validateSubscriptionUsage(Subscription subscription) {
        if (subscription == null) {
            throw new IllegalStateException("No subscription found. Service access rejected.");
        }
        if (subscription.getStatus() == SubscriptionStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Subscription is pending payment. Service access restricted.");
        }
        if (subscription.getStatus() == SubscriptionStatus.EXPIRED) {
            throw new IllegalStateException("Subscription has expired. Service access rejected.");
        }
        if (subscription.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new IllegalStateException("Subscription has been cancelled. Service access rejected.");
        }
        if (!isSubscriptionValid(subscription)) {
            throw new IllegalStateException("Subscription is invalid or outside active dates. Service access rejected.");
        }
    }

    /**
     * Lấy Subscription hiện tại của User (Owner).
     */
    public Subscription getCurrentSubscription(User owner) {
        return subscriptionRepository.findTopByOwnerOrderByCreatedAtDesc(owner)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for the current owner"));
    }

    /**
     * Lấy Subscription theo ID và kiểm tra quyền sở hữu của Owner.
     */
    public Subscription getSubscriptionById(Long id, User owner) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        if (!subscription.getOwner().getId().equals(owner.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You do not own this subscription");
        }

        return subscription;
    }

    /**
     * Xử lý cancellation với kiểm tra quyền sở hữu.
     * Chỉ cho phép ACTIVE -> CANCELLED.
     */
    public Subscription cancelSubscription(Long id, User owner, String reason) {
        Subscription subscription = getSubscriptionById(id, owner);

        // Enforce only ACTIVE can be cancelled
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE subscriptions can be cancelled. Current status: " + subscription.getStatus());
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason);

        return subscriptionRepository.save(subscription);
    }

    /**
     * Xử lý cancellation.
     * Chỉ cho phép ACTIVE -> CANCELLED.
     */
    public Subscription cancelSubscription(Long id, String reason) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + id));

        // Enforce only ACTIVE can be cancelled
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE subscriptions can be cancelled. Current status: " + subscription.getStatus());
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscription.setCancellationReason(reason);

        return subscriptionRepository.save(subscription);
    }

    /**
     * Scheduled job kiểm tra định kỳ (chạy mỗi ngày vào lúc nửa đêm).
     * ACTIVE -> EXPIRED khi hết hạn (endDate < today).
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void checkAndExpireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> activeSubscriptions = subscriptionRepository.findAllByStatus(SubscriptionStatus.ACTIVE);
        for (Subscription subscription : activeSubscriptions) {
            if (subscription.getEndDate() != null && subscription.getEndDate().isBefore(now)) {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscriptionRepository.save(subscription);
            }
        }
    }
}
