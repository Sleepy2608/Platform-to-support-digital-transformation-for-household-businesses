package com.hbdt.sepay.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.repository.*;
import com.hbdt.sepay.dto.SepayWebhookPayload;
import com.hbdt.sepay.dto.SepayWebhookResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class SepayWebhookService {

    private static final Logger logger = LoggerFactory.getLogger(SepayWebhookService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final ServiceInvoiceRepository serviceInvoiceRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;
    private final UserRepository userRepository;

    @Value("${sepay.secret-key:spsk_test_4hP4UGF9NSNY5Hjyt8mbVcT8P2wWEBNS}")
    private String secretKey;

    @Value("${sepay.account-number:108871728162}")
    private String expectedAccountNumber;

    // Các mẫu regex bóc tách mã định danh trong content chuyển khoản
    private static final Pattern SUB_TEST_PATTERN = Pattern.compile("(?i)HBDT[\\s-_]+SUB[\\s-_]+TEST[\\s-_]+(\\d+)");
    private static final Pattern SUB_ID_PATTERN = Pattern.compile("(?i)HBDT[\\s-_]+SUB[\\s-_]+(\\d+)");
    private static final Pattern SUB_SHORT_PATTERN = Pattern.compile("(?i)SUB[\\s-_]+(\\d+)");
    private static final Pattern RENEW_BUSINESS_MONTHS_PATTERN = Pattern.compile("(?i)HBDT[\\s-_]+RENEW[\\s-_]+(\\d+)[\\s-_]+(\\d+)");
    private static final Pattern RENEW_BUSINESS_PATTERN = Pattern.compile("(?i)HBDT[\\s-_]+RENEW[\\s-_]+(\\d+)");
    private static final Pattern INVOICE_PATTERN = Pattern.compile("(?i)(INV-\\d{8}-[A-Za-z0-9]+)");

    /**
     * Xác thực header Authorization từ SePay
     */
    public boolean isValidAuthorization(String authHeader) {
        if (secretKey == null || secretKey.isBlank()) {
            return true;
        }
        if (authHeader == null || authHeader.isBlank()) {
            return false;
        }
        String token = authHeader.trim();
        if (token.regionMatches(true, 0, "Apikey ", 0, 7)) {
            token = token.substring(7).trim();
        } else if (token.regionMatches(true, 0, "Bearer ", 0, 7)) {
            token = token.substring(7).trim();
        }
        return secretKey.trim().equals(token);
    }

    /**
     * Xử lý webhook biến động số dư từ SePay
     */
    public SepayWebhookResponse processWebhook(SepayWebhookPayload payload, String authHeader) {
        if (payload == null) {
            throw new BadRequestException("Payload webhook không được để trống");
        }

        // Kiểm tra bảo mật nếu có header Authorization gửi kèm
        if (authHeader != null && !authHeader.isBlank() && !isValidAuthorization(authHeader)) {
            logger.warn("SePay webhook unauthorized request with token: {}", authHeader);
            throw new BadRequestException("Xác thực SePay API Key không hợp lệ");
        }

        logger.info("Nhận SePay webhook: id={}, gateway={}, transferType={}, amount={}, content={}",
                payload.getId(), payload.getGateway(), payload.getTransferType(),
                payload.getTransferAmount(), payload.getContent());

        // Chỉ xử lý giao dịch tiền vào (in)
        if (payload.getTransferType() != null && !"in".equalsIgnoreCase(payload.getTransferType().trim())) {
            logger.info("Bỏ qua giao dịch tiền ra: id={}, type={}", payload.getId(), payload.getTransferType());
            return SepayWebhookResponse.ok("Bỏ qua giao dịch tiền ra");
        }

        // Tạo mã giao dịch duy nhất cho Idempotency
        String txnId = resolveTransactionId(payload);

        // Kiểm tra xem giao dịch này đã được ghi nhận trước đó hay chưa (tránh cộng 2 lần)
        if (paymentHistoryRepository.findByTransactionId(txnId).isPresent()) {
            logger.info("Giao dịch SePay {} đã được xử lý trước đó, bỏ qua để tránh trùng lặp.", txnId);
            return SepayWebhookResponse.ok("Giao dịch đã được xử lý trước đó");
        }

        String content = payload.getContent() != null ? payload.getContent() : "";
        Long subId = extractSubscriptionId(content, payload.getCode());
        Long businessId = null;
        int renewMonths = 1;

        if (subId == null) {
            // Thử bóc tách mã gia hạn hộ kinh doanh
            Matcher mRenewBm = RENEW_BUSINESS_MONTHS_PATTERN.matcher(content);
            if (mRenewBm.find()) {
                businessId = Long.parseLong(mRenewBm.group(1));
                renewMonths = Integer.parseInt(mRenewBm.group(2));
            } else {
                Matcher mRenewB = RENEW_BUSINESS_PATTERN.matcher(content);
                if (mRenewB.find()) {
                    businessId = Long.parseLong(mRenewB.group(1));
                    renewMonths = 1;
                }
            }
        }

        if (subId != null) {
            return processSubscriptionById(subId, payload, txnId);
        } else if (businessId != null) {
            return processSubscriptionByBusinessId(businessId, renewMonths, payload, txnId);
        } else {
            // Thử tìm theo Invoice Code
            Matcher mInv = INVOICE_PATTERN.matcher(content);
            if (mInv.find()) {
                String invCode = mInv.group(1);
                Optional<ServiceInvoice> invoiceOpt = serviceInvoiceRepository.findByInvoiceCode(invCode);
                if (invoiceOpt.isPresent() && invoiceOpt.get().getSubscription() != null) {
                    return processSubscriptionById(invoiceOpt.get().getSubscription().getId(), payload, txnId);
                }
            }

            logger.warn("Không tìm thấy mã Subscription hoặc Business hợp lệ trong nội dung SePay: '{}'", content);
            // Vẫn lưu PaymentHistory ghi nhận để kế toán đối soát thủ công
            recordUnmatchedPayment(payload, txnId);
            return SepayWebhookResponse.ok("Đã ghi nhận giao dịch (cần đối soát thủ công nội dung)");
        }
    }

    private SepayWebhookResponse processSubscriptionById(Long subId, SepayWebhookPayload payload, String txnId) {
        Subscription subscription = subscriptionRepository.findById(subId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy gói subscription với ID: " + subId));

        LocalDate now = LocalDate.now();
        int months = "YEARLY".equalsIgnoreCase(subscription.getBillingCycle()) ? 12 : 1;

        if (subscription.getStatus() == SubscriptionStatus.PENDING_PAYMENT) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartDate(now);
            subscription.setEndDate(now.plusMonths(months));
        } else if (subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            LocalDate baseDate = subscription.getEndDate() != null && subscription.getEndDate().isAfter(now)
                    ? subscription.getEndDate()
                    : now;
            subscription.setEndDate(baseDate.plusMonths(months));
        } else {
            // Kích hoạt lại nếu cần
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartDate(now);
            subscription.setEndDate(now.plusMonths(months));
        }
        subscriptionRepository.save(subscription);

        // Ghi nhận lịch sử thanh toán hoàn tất
        PaymentHistory payment = PaymentHistory.builder()
                .transactionId(txnId)
                .subscriptionId(subscription.getId())
                .amount(payload.getTransferAmount() != null ? payload.getTransferAmount() : BigDecimal.ZERO)
                .paymentMethod("SEPAY_BANK_TRANSFER")
                .paidAt(LocalDateTime.now())
                .status("COMPLETED")
                .build();
        paymentHistoryRepository.save(payment);

        // Cập nhật hóa đơn
        updateOrCreateInvoice(subscription, payment, months);

        // Ghi nhận nhật ký lịch sử subscription
        SubscriptionHistory history = SubscriptionHistory.builder()
                .subscriptionId(subscription.getId())
                .oldPlan(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : "VIP")
                .newPlan(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : "VIP")
                .action("SEPAY_WEBHOOK_ACTIVE")
                .changedBy("SEPAY_SYSTEM")
                .changedAt(LocalDateTime.now())
                .build();
        subscriptionHistoryRepository.save(history);

        logger.info("Kích hoạt thành công Subscription ID {} qua SePay Webhook. Hạn mới: {}",
                subscription.getId(), subscription.getEndDate());
        return SepayWebhookResponse.ok("Kích hoạt gói subscription thành công");
    }

    private SepayWebhookResponse processSubscriptionByBusinessId(Long businessId, int months, SepayWebhookPayload payload, String txnId) {
        Subscription subscription = subscriptionRepository
                .findTopByBusinessIdAndStatusOrderByCreatedAtDesc(businessId, SubscriptionStatus.ACTIVE)
                .or(() -> subscriptionRepository.findTopByBusinessIdOrderByCreatedAtDesc(businessId))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy subscription cho Business ID: " + businessId));

        LocalDate now = LocalDate.now();
        LocalDate baseDate = subscription.getEndDate() != null && subscription.getEndDate().isAfter(now)
                ? subscription.getEndDate()
                : now;

        subscription.setEndDate(baseDate.plusMonths(months));
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartDate(now);
        }
        subscriptionRepository.save(subscription);

        // Ghi nhận PaymentHistory
        PaymentHistory payment = PaymentHistory.builder()
                .transactionId(txnId)
                .subscriptionId(subscription.getId())
                .amount(payload.getTransferAmount() != null ? payload.getTransferAmount() : BigDecimal.ZERO)
                .paymentMethod("SEPAY_BANK_TRANSFER")
                .paidAt(LocalDateTime.now())
                .status("COMPLETED")
                .build();
        paymentHistoryRepository.save(payment);

        updateOrCreateInvoice(subscription, payment, months);

        SubscriptionHistory history = SubscriptionHistory.builder()
                .subscriptionId(subscription.getId())
                .oldPlan(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : "VIP")
                .newPlan(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : "VIP")
                .action("SEPAY_WEBHOOK_RENEW")
                .changedBy("SEPAY_SYSTEM")
                .changedAt(LocalDateTime.now())
                .build();
        subscriptionHistoryRepository.save(history);

        logger.info("Gia hạn thành công Subscription ID {} thêm {} tháng cho Business ID {}. Hạn mới: {}",
                subscription.getId(), months, businessId, subscription.getEndDate());
        return SepayWebhookResponse.ok("Gia hạn gói subscription thành công");
    }

    private void updateOrCreateInvoice(Subscription subscription, PaymentHistory payment, int months) {
        List<ServiceInvoice> existingInvoices = serviceInvoiceRepository.findBySubscriptionId(subscription.getId());
        for (ServiceInvoice inv : existingInvoices) {
            if ("PENDING".equalsIgnoreCase(inv.getStatus())) {
                inv.setStatus("PAID");
                serviceInvoiceRepository.save(inv);
                return;
            }
        }

        // Tạo mới hóa đơn PAID nếu chưa có
        String today = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String invoiceCode = "INV-" + today + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT);
        String invoiceNo = "INV-" + today + "-" + String.format("%04d", (int)(Math.random() * 10000));
        BigDecimal unitPrice = payment.getAmount().divide(BigDecimal.valueOf(Math.max(1, months)), 2, RoundingMode.HALF_UP);

        User user = null;
        if (subscription.getUserId() != null && subscription.getUserId() > 0) {
            user = userRepository.findById(subscription.getUserId()).orElse(null);
        }
        if (user == null && subscription.getBusinessId() != null) {
            user = userRepository.findFirstByBusinessIdAndRole_Name(subscription.getBusinessId(), RoleType.BUSINESS_OWNER)
                    .orElse(null);
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst().orElse(null);
        }
        if (user != null && (subscription.getUserId() == null || subscription.getUserId() <= 0)) {
            subscription.setUserId(user.getId());
            subscriptionRepository.save(subscription);
        }

        ServiceInvoice invoice = ServiceInvoice.builder()
                .invoiceCode(invoiceCode)
                .invoiceNo(invoiceNo)
                .businessId(subscription.getBusinessId())
                .user(user)
                .subscription(subscription)
                .plan(subscription.getPlan())
                .duration(months)
                .unitPrice(unitPrice)
                .totalAmount(payment.getAmount())
                .amount(payment.getAmount())
                .status("PAID")
                .build();
        serviceInvoiceRepository.save(invoice);
    }

    private void recordUnmatchedPayment(SepayWebhookPayload payload, String txnId) {
        PaymentHistory payment = PaymentHistory.builder()
                .transactionId(txnId)
                .subscriptionId(0L)
                .amount(payload.getTransferAmount() != null ? payload.getTransferAmount() : BigDecimal.ZERO)
                .paymentMethod("SEPAY_BANK_TRANSFER_UNMATCHED")
                .paidAt(LocalDateTime.now())
                .status("PENDING_REVIEW")
                .build();
        paymentHistoryRepository.save(payment);
    }

    private Long extractSubscriptionId(String content, String code) {
        if (code != null && !code.isBlank()) {
            Matcher mCode = Pattern.compile("(\\d+)").matcher(code);
            if (mCode.find()) {
                return Long.parseLong(mCode.group(1));
            }
        }
        if (content == null || content.isBlank()) {
            return null;
        }

        Matcher mSubTest = SUB_TEST_PATTERN.matcher(content);
        if (mSubTest.find()) {
            return Long.parseLong(mSubTest.group(1));
        }

        Matcher mSubId = SUB_ID_PATTERN.matcher(content);
        if (mSubId.find()) {
            return Long.parseLong(mSubId.group(1));
        }

        Matcher mSubShort = SUB_SHORT_PATTERN.matcher(content);
        if (mSubShort.find()) {
            return Long.parseLong(mSubShort.group(1));
        }

        return null;
    }

    private String resolveTransactionId(SepayWebhookPayload payload) {
        if (payload.getId() != null) {
            return "SEPAY-" + payload.getId();
        }
        if (payload.getReferenceCode() != null && !payload.getReferenceCode().isBlank()) {
            return "SEPAY-REF-" + payload.getReferenceCode().trim();
        }
        return "SEPAY-TXN-" + UUID.randomUUID();
    }
}
