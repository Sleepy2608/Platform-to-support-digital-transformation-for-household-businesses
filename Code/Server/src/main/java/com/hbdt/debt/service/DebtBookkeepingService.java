package com.hbdt.debt.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.DebtTransactionStatus;
import com.hbdt.entity.enums.DebtTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import com.hbdt.entity.enums.PaymentStatus;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.SalesOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service ghi nhận và quản lý công nợ tự động — HBDT-66 Automatic Debt Bookkeeping.
 *
 * <p>Là nguồn chân lý duy nhất (Single Source of Truth) cho:
 * <ul>
 *   <li>Tính số dư công nợ khách hàng từ tập giao dịch ACTIVE.</li>
 *   <li>Ghi nhận phát sinh công nợ (DEBT_INCREASE) khi tạo đơn chưa thanh toán đủ.</li>
 *   <li>Ghi nhận thanh toán / trả nợ (PAYMENT) từng phần hoặc toàn phần.</li>
 *   <li>Ghi nhận đảo công nợ (VOID) khi đơn hàng bị hủy.</li>
 * </ul>
 *
 * <p>Đảm bảo:
 * <ul>
 *   <li>Tenant isolation: mọi thao tác đều kiểm tra businessId.</li>
 *   <li>ACID & Concurrency: khóa bi-directional với Customer và SalesOrder.</li>
 *   <li>Idempotency: chống ghi trùng giao dịch khi request gửi lại.</li>
 *   <li>BigDecimal scale chuẩn hóa đồng nhất 2 chữ số thập phân.</li>
 * </ul>
 */
@Service
public class DebtBookkeepingService {

    private static final Logger log = LoggerFactory.getLogger(DebtBookkeepingService.class);
    private static final int SCALE = 2;

    private final DebtTransactionRepository debtTransactionRepository;
    private final CustomerRepository customerRepository;
    private final SalesOrderRepository salesOrderRepository;

    public DebtBookkeepingService(
            DebtTransactionRepository debtTransactionRepository,
            CustomerRepository customerRepository,
            SalesOrderRepository salesOrderRepository
    ) {
        this.debtTransactionRepository = debtTransactionRepository;
        this.customerRepository = customerRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    // -------------------------------------------------------------------------
    // 1. Tính toán số dư công nợ khách hàng (Read-only query)
    // -------------------------------------------------------------------------

    /**
     * Tính toán số dư công nợ thực tế của khách hàng từ sổ giao dịch ACTIVE.
     *
     * <p>Công thức: SUM(DEBT_INCREASE) - SUM(PAYMENT) - SUM(VOID) + SUM(ADJUSTMENT).
     * Không phụ thuộc mù quáng vào ID giao dịch cuối cùng để tránh lệch thứ tự.</p>
     *
     * @param customerId ID khách hàng
     * @param businessId ID hộ kinh doanh (tenant)
     * @return số dư công nợ hiện tại (luôn >= 0)
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateCustomerDebt(Long customerId, Long businessId) {
        if (customerId == null || businessId == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }

        BigDecimal balance = debtTransactionRepository.calculateCurrentBalance(customerId, businessId);
        if (balance == null) {
            // Fallback: nếu chưa có transaction hoặc môi trường test không stub calculateCurrentBalance
            return customerRepository.findByIdAndBusinessId(customerId, businessId)
                    .map(Customer::getDebtBalance)
                    .map(b -> b.setScale(SCALE, RoundingMode.HALF_UP))
                    .orElse(BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal normalized = balance.setScale(SCALE, RoundingMode.HALF_UP);
        return normalized.signum() < 0 ? BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP) : normalized;
    }

    // -------------------------------------------------------------------------
    // 2. Ghi nhận phát sinh nợ khi tạo đơn hàng (DEBT_INCREASE)
    // -------------------------------------------------------------------------

    /**
     * Ghi nhận phát sinh công nợ khi đơn hàng bán có số tiền chưa thanh toán đủ.
     *
     * @param order      đơn hàng đã lưu
     * @param customer   khách hàng (đã được lock hoặc xác thực)
     * @param actorId    ID người thực hiện
     * @param debtAmount số tiền nợ phát sinh
     * @return bản ghi DebtTransaction vừa tạo
     */
    @Transactional
    public DebtTransaction recordDebtIncrease(
            SalesOrder order,
            Customer customer,
            Long actorId,
            BigDecimal debtAmount
    ) {
        if (order == null || customer == null || debtAmount == null || debtAmount.signum() <= 0) {
            return null;
        }

        validateTenantIsolation(order, customer);

        BigDecimal normalizedDebt = normalize(debtAmount);

        // -- Idempotency check: mỗi đơn hàng chỉ có tối đa 1 bút toán DEBT_INCREASE ACTIVE
        if (debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                order.getId(), order.getBusinessId(), DebtTransactionType.DEBT_INCREASE.name(), DebtTransactionStatus.ACTIVE)) {
            log.warn("[DebtBookkeeping] Đơn hàng #{} đã có giao dịch DEBT_INCREASE, bỏ qua để tránh trùng lặp.",
                    order.getId());
            return debtTransactionRepository.findBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                    order.getId(), order.getBusinessId(), DebtTransactionType.DEBT_INCREASE.name(), DebtTransactionStatus.ACTIVE)
                    .orElse(null);
        }

        BigDecimal balanceBefore = calculateCustomerDebt(customer.getId(), order.getBusinessId());
        BigDecimal balanceAfter = balanceBefore.add(normalizedDebt);

        String transactionCode = "DEBT-SO-" + order.getId();

        DebtTransaction transaction = DebtTransaction.builder()
                .businessId(order.getBusinessId())
                .customerId(customer.getId())
                .salesOrderId(order.getId())
                .createdBy(actorId)
                .transactionCode(transactionCode)
                .transactionType(DebtTransactionType.DEBT_INCREASE.name())
                .amount(normalizedDebt)
                .balanceAfter(balanceAfter)
                .transactionDate(order.getConfirmedAt() != null ? order.getConfirmedAt() : LocalDateTime.now())
                .status(DebtTransactionStatus.ACTIVE)
                .description("Phát sinh công nợ từ đơn " + order.getOrderCode())
                .build();

        DebtTransaction saved = debtTransactionRepository.save(transaction);
        customer.setDebtBalance(balanceAfter);
        customerRepository.save(customer);

        log.info("[DebtBookkeeping] Đã ghi nhận nợ đơn #{} | customer={} | debtAmount={} | balanceAfter={}",
                order.getId(), customer.getId(), normalizedDebt, balanceAfter);

        return saved;
    }

    // -------------------------------------------------------------------------
    // 3. Ghi nhận thanh toán công nợ (PAYMENT)
    // -------------------------------------------------------------------------

    /**
     * Ghi nhận thanh toán đơn hàng (toàn phần hoặc một phần), cập nhật công nợ và trạng thái đơn.
     *
     * @param order           đơn hàng
     * @param customer        khách hàng
     * @param actorId         ID người thực hiện
     * @param amount          số tiền thanh toán
     * @param paymentMethod   phương thức (CASH, BANK_TRANSFER)
     * @param referenceNumber mã tham chiếu nếu chuyển khoản
     * @param paymentDate     ngày thanh toán (nếu null lấy now)
     * @param note            ghi chú thanh toán
     * @return bản ghi DebtTransaction vừa tạo
     */
    @Transactional
    public DebtTransaction recordPayment(
            SalesOrder order,
            Customer customer,
            Long actorId,
            BigDecimal amount,
            PaymentMethod paymentMethod,
            String referenceNumber,
            LocalDateTime paymentDate,
            String note
    ) {
        if (order == null || customer == null) {
            throw new BadRequestException("Đơn hàng hoặc khách hàng không hợp lệ");
        }

        validateTenantIsolation(order, customer);

        if (!"CONFIRMED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể ghi nhận thanh toán cho đơn hàng đã xác nhận (CONFIRMED)");
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Đơn hàng đã được thanh toán đầy đủ");
        }

        if (amount == null || amount.signum() <= 0) {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
        }

        BigDecimal normalizedAmount = normalize(amount);
        BigDecimal currentOrderPaid = order.getPaidAmount() != null ? normalize(order.getPaidAmount()) : BigDecimal.ZERO;
        BigDecimal currentOrderTotal = normalize(order.getTotalAmount());
        BigDecimal remainingAmount = currentOrderTotal.subtract(currentOrderPaid);

        if (normalizedAmount.compareTo(remainingAmount) > 0) {
            throw new BadRequestException(String.format(
                    "Số tiền thanh toán (%s) vượt quá số tiền còn phải trả của đơn hàng (%s)",
                    normalizedAmount, remainingAmount));
        }

        PaymentMethod method = paymentMethod != null ? paymentMethod : PaymentMethod.CASH;
        if (method == PaymentMethod.BANK_TRANSFER && (referenceNumber == null || referenceNumber.isBlank())) {
            throw new BadRequestException("Mã tham chiếu (referenceNumber) là bắt buộc khi thanh toán bằng chuyển khoản");
        }

        BigDecimal balanceBefore = calculateCustomerDebt(customer.getId(), order.getBusinessId());
        BigDecimal balanceAfter = balanceBefore.subtract(normalizedAmount);
        if (balanceAfter.signum() < 0) {
            throw new BadRequestException("Số tiền thanh toán vượt quá tổng công nợ hiện tại của khách hàng");
        }

        LocalDateTime txDate = paymentDate != null ? paymentDate : LocalDateTime.now();
        String transactionCode = "PAY-SO-" + order.getId() + "-" + shortId();

        DebtTransaction transaction = DebtTransaction.builder()
                .businessId(order.getBusinessId())
                .customerId(customer.getId())
                .salesOrderId(order.getId())
                .createdBy(actorId)
                .transactionCode(transactionCode)
                .transactionType(DebtTransactionType.PAYMENT.name())
                .amount(normalizedAmount)
                .paymentMethod(method.name())
                .referenceNumber(referenceNumber != null && !referenceNumber.isBlank() ? referenceNumber.trim() : null)
                .transactionDate(txDate)
                .balanceAfter(balanceAfter)
                .status(DebtTransactionStatus.ACTIVE)
                .description(note != null && !note.isBlank() ? note.trim() : "Thanh toán công nợ đơn " + order.getOrderCode())
                .build();

        DebtTransaction savedTx = debtTransactionRepository.save(transaction);
        customer.setDebtBalance(balanceAfter);
        customerRepository.save(customer);

        // Cập nhật SalesOrder
        BigDecimal newPaidAmount = currentOrderPaid.add(normalizedAmount);
        BigDecimal newDebtAmount = currentOrderTotal.subtract(newPaidAmount);
        PaymentStatus newPaymentStatus = determinePaymentStatus(newPaidAmount, currentOrderTotal);

        order.setPaidAmount(newPaidAmount);
        order.setDebtAmount(newDebtAmount);
        order.setPaymentStatus(newPaymentStatus);
        order.setLastPaymentAt(txDate);
        salesOrderRepository.save(order);

        log.info("[DebtBookkeeping] Đã ghi nhận thanh toán đơn #{} | amount={} | newPaid={} | newDebt={} | status={}",
                order.getId(), normalizedAmount, newPaidAmount, newDebtAmount, newPaymentStatus);

        return savedTx;
    }

    // -------------------------------------------------------------------------
    // 4. Ghi nhận đảo công nợ khi hủy đơn hàng (VOID)
    // -------------------------------------------------------------------------

    /**
     * Ghi nhận đảo nợ khi hủy đơn hàng có công nợ còn lại.
     *
     * @param order    đơn hàng bị hủy
     * @param customer khách hàng
     * @param actorId  ID người thực hiện hủy
     * @param reason   lý do đảo nợ / hủy đơn
     * @return bản ghi DebtTransaction VOID vừa tạo (hoặc null nếu đơn không có nợ tồn)
     */
    @Transactional
    public DebtTransaction recordDebtVoid(
            SalesOrder order,
            Customer customer,
            Long actorId,
            String reason
    ) {
        if (order == null || customer == null) {
            return null;
        }

        validateTenantIsolation(order, customer);

        if (order.getDebtAmount() == null || order.getDebtAmount().signum() <= 0) {
            return null;
        }

        // Idempotency: tránh đảo nợ 2 lần cho cùng một đơn hàng
        if (debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                order.getId(), order.getBusinessId(), DebtTransactionType.VOID.name(), DebtTransactionStatus.ACTIVE)) {
            log.warn("[DebtBookkeeping] Đơn hàng #{} đã có giao dịch VOID công nợ, bỏ qua.", order.getId());
            return debtTransactionRepository.findBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                    order.getId(), order.getBusinessId(), DebtTransactionType.VOID.name(), DebtTransactionStatus.ACTIVE)
                    .orElse(null);
        }

        BigDecimal voidAmount = normalize(order.getDebtAmount());
        BigDecimal balanceBefore = calculateCustomerDebt(customer.getId(), order.getBusinessId());
        BigDecimal balanceAfter = balanceBefore.subtract(voidAmount);

        if (balanceAfter.signum() < 0) {
            throw new BadRequestException("Dữ liệu công nợ không nhất quán, không thể đảo nợ khi hủy đơn");
        }

        String transactionCode = "REV-SO-" + order.getId();

        DebtTransaction transaction = DebtTransaction.builder()
                .businessId(order.getBusinessId())
                .customerId(customer.getId())
                .salesOrderId(order.getId())
                .createdBy(actorId)
                .transactionCode(transactionCode)
                .transactionType(DebtTransactionType.VOID.name())
                .amount(voidAmount)
                .balanceAfter(balanceAfter)
                .transactionDate(LocalDateTime.now())
                .status(DebtTransactionStatus.ACTIVE)
                .description(reason != null && !reason.isBlank()
                        ? reason.trim()
                        : "Đảo công nợ do hủy đơn " + order.getOrderCode())
                .build();

        DebtTransaction saved = debtTransactionRepository.save(transaction);
        customer.setDebtBalance(balanceAfter);
        customerRepository.save(customer);

        order.setDebtAmount(BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP));
        salesOrderRepository.save(order);

        log.info("[DebtBookkeeping] Đã đảo nợ hủy đơn #{} | voidAmount={} | balanceAfter={}",
                order.getId(), voidAmount, balanceAfter);

        return saved;
    }

    // -------------------------------------------------------------------------
    // Helper validation & normalization methods
    // -------------------------------------------------------------------------

    private void validateTenantIsolation(SalesOrder order, Customer customer) {
        if (order.getBusinessId() == null || customer.getBusinessId() == null
                || !order.getBusinessId().equals(customer.getBusinessId())) {
            throw new BadRequestException("Dữ liệu vi phạm cách ly hộ kinh doanh (tenant isolation)");
        }
        if (order.getCustomerId() != null && !order.getCustomerId().equals(customer.getId())) {
            throw new BadRequestException("Khách hàng không khớp với khách hàng gắn trên đơn hàng");
        }
    }

    private BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private PaymentStatus determinePaymentStatus(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount == null || paidAmount.signum() <= 0) {
            return PaymentStatus.UNPAID;
        }
        return paidAmount.compareTo(totalAmount) >= 0
                ? PaymentStatus.PAID
                : PaymentStatus.PARTIALLY_PAID;
    }

    private String shortId() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
