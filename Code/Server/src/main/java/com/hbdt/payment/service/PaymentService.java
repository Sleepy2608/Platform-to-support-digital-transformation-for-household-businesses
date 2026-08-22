package com.hbdt.payment.service;

import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.DebtTransactionStatus;
import com.hbdt.entity.enums.DebtTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import com.hbdt.entity.enums.PaymentStatus;
import com.hbdt.payment.dto.CreatePaymentRequest;
import com.hbdt.payment.dto.CustomerDebtSummaryResponse;
import com.hbdt.payment.dto.OrderPaymentSummaryResponse;
import com.hbdt.payment.dto.PaymentResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PaymentService {

    private final SalesOrderRepository salesOrderRepository;
    private final DebtTransactionRepository debtTransactionRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public PaymentService(SalesOrderRepository salesOrderRepository,
                          DebtTransactionRepository debtTransactionRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.debtTransactionRepository = debtTransactionRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    // ==================== Tạo giao dịch thanh toán ====================

    @Transactional
    public PaymentResponse createPayment(String username, CreatePaymentRequest request) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        // 1. Validate order
        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(request.salesOrderId(), businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc cửa hàng của bạn"));

        validateOrderForPayment(order);

        // 2. Validate customer
        Customer customer = validateCustomer(order, request.customerId(), businessId);

        // 3. Validate payment method
        PaymentMethod method = parsePaymentMethod(request.paymentMethod());
        if (method == PaymentMethod.BANK_TRANSFER
                && (request.referenceNumber() == null || request.referenceNumber().isBlank())) {
            throw new IllegalArgumentException(
                    "Mã tham chiếu (referenceNumber) là bắt buộc khi thanh toán bằng chuyển khoản");
        }

        // 4. Tính số tiền còn phải trả
        BigDecimal remainingAmount = order.getTotalAmount().subtract(order.getPaidAmount());
        if (request.amount().compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException(
                    String.format("Số tiền thanh toán (%s) vượt quá số tiền còn phải trả (%s)",
                            request.amount(), remainingAmount));
        }

        // 5. Tính số dư công nợ khách hàng trước giao dịch
        BigDecimal customerDebtBefore = calculateCustomerDebt(customer.getId(), businessId);
        BigDecimal balanceAfter = customerDebtBefore.subtract(request.amount());

        // 6. Sinh mã giao dịch
        String transactionCode = generateTransactionCode(request.salesOrderId());

        // 7. Tạo DebtTransaction
        LocalDateTime paymentDate = request.paymentDate() != null
                ? request.paymentDate() : LocalDateTime.now();

        DebtTransaction transaction = DebtTransaction.builder()
                .businessId(businessId)
                .customerId(customer.getId())
                .salesOrderId(order.getId())
                .createdBy(user.getId())
                .transactionCode(transactionCode)
                .transactionType(DebtTransactionType.PAYMENT.name())
                .amount(request.amount())
                .paymentMethod(method.name())
                .referenceNumber(request.referenceNumber())
                .balanceAfter(balanceAfter)
                .description(request.note())
                .status(DebtTransactionStatus.ACTIVE)
                .build();

        debtTransactionRepository.save(transaction);

        // 8. Cập nhật SalesOrder
        BigDecimal newPaidAmount = order.getPaidAmount().add(request.amount());
        BigDecimal newDebtAmount = order.getTotalAmount().subtract(newPaidAmount);
        PaymentStatus newPaymentStatus = determinePaymentStatus(newPaidAmount, order.getTotalAmount());

        order.setPaidAmount(newPaidAmount);
        order.setDebtAmount(newDebtAmount);
        order.setPaymentStatus(newPaymentStatus);
        order.setLastPaymentAt(paymentDate);
        salesOrderRepository.save(order);

        // 9. Build response
        return buildPaymentResponse(transaction, order, customer, user);
    }

    // ==================== Tra cứu thanh toán theo đơn hàng ====================

    public List<PaymentResponse> getOrderPayments(String username, Long orderId) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc cửa hàng của bạn"));

        List<DebtTransaction> transactions = debtTransactionRepository
                .findBySalesOrderIdAndBusinessIdAndStatus(orderId, businessId, DebtTransactionStatus.ACTIVE);

        return transactions.stream()
                .map(tx -> buildPaymentResponseForHistory(tx, order))
                .toList();
    }

    public OrderPaymentSummaryResponse getOrderPaymentSummary(String username, Long orderId) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc cửa hàng của bạn"));

        BigDecimal remainingAmount = order.getTotalAmount().subtract(order.getPaidAmount());

        List<DebtTransaction> transactions = debtTransactionRepository
                .findBySalesOrderIdAndBusinessIdAndStatus(orderId, businessId, DebtTransactionStatus.ACTIVE);

        // Lấy thông tin khách hàng nếu có
        String customerName = null;
        if (order.getCustomerId() != null) {
            customerName = customerRepository.findByIdAndBusinessId(order.getCustomerId(), businessId)
                    .map(Customer::getCustomerName)
                    .orElse(null);
        }

        return new OrderPaymentSummaryResponse(
                order.getId(),
                order.getOrderCode(),
                order.getCustomerId(),
                customerName,
                order.getTotalAmount(),
                order.getPaidAmount(),
                remainingAmount,
                order.getPaymentStatus().name(),
                transactions.size()
        );
    }

    // ==================== Lịch sử thanh toán theo khách hàng ====================

    public PageResponse<PaymentResponse> getCustomerPaymentHistory(
            String username, Long customerId, int page, int size) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        // Validate customer
        customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khách hàng hoặc khách hàng không thuộc cửa hàng của bạn"));

        Pageable pageable = PageRequest.of(page, size);
        Page<DebtTransaction> txPage = debtTransactionRepository
                .findByCustomerIdAndBusinessIdAndStatus(customerId, businessId,
                        DebtTransactionStatus.ACTIVE, pageable);

        Page<PaymentResponse> responsePage = txPage.map(this::buildPaymentResponseForCustomerHistory);
        return PageResponse.from(responsePage);
    }

    public CustomerDebtSummaryResponse getCustomerDebtSummary(String username, Long customerId) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        Customer customer = customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khách hàng hoặc khách hàng không thuộc cửa hàng của bạn"));

        BigDecimal totalDebt = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.DEBT_INCREASE.name());
        BigDecimal totalPaid = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.PAYMENT.name());
        BigDecimal currentBalance = totalDebt.subtract(totalPaid);

        return new CustomerDebtSummaryResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCustomerName(),
                totalDebt,
                totalPaid,
                currentBalance
        );
    }

    // ==================== Helper methods ====================

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }

    private void validateOrderForPayment(SalesOrder order) {
        // Chỉ cho thanh toán đơn đã xác nhận (CONFIRMED) hoặc đang hoạt động
        String status = order.getStatus();
        if ("DRAFT".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException(
                    "Không thể ghi nhận thanh toán cho đơn hàng ở trạng thái: " + status);
        }
        // Đã thanh toán đủ
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException("Đơn hàng đã được thanh toán đầy đủ");
        }
    }

    private Customer validateCustomer(SalesOrder order, Long requestCustomerId, Long businessId) {
        Long customerId = requestCustomerId != null ? requestCustomerId : order.getCustomerId();

        if (customerId == null) {
            throw new IllegalArgumentException(
                    "Đơn hàng phải có khách hàng để ghi nhận thanh toán/công nợ");
        }

        // Kiểm tra customerId khớp với đơn hàng nếu đơn đã có customer
        if (order.getCustomerId() != null && !order.getCustomerId().equals(customerId)) {
            throw new IllegalArgumentException(
                    "Khách hàng trong yêu cầu thanh toán không khớp với khách hàng của đơn hàng");
        }

        return customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy khách hàng hoặc khách hàng không thuộc cửa hàng của bạn"));
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Phương thức thanh toán không hợp lệ: " + method
                            + ". Chỉ hỗ trợ: CASH, BANK_TRANSFER");
        }
    }

    private BigDecimal calculateCustomerDebt(Long customerId, Long businessId) {
        BigDecimal totalDebt = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.DEBT_INCREASE.name());
        BigDecimal totalPaid = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.PAYMENT.name());
        return totalDebt.subtract(totalPaid);
    }

    private PaymentStatus determinePaymentStatus(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount.compareTo(BigDecimal.ZERO) == 0) {
            return PaymentStatus.UNPAID;
        } else if (paidAmount.compareTo(totalAmount) >= 0) {
            return PaymentStatus.PAID;
        } else {
            return PaymentStatus.PARTIALLY_PAID;
        }
    }

    private String generateTransactionCode(Long salesOrderId) {
        long count = debtTransactionRepository.countBySalesOrderId(salesOrderId);
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("PAY-%s-%04d", datePart, count + 1);
    }

    private PaymentResponse buildPaymentResponse(DebtTransaction tx, SalesOrder order,
                                                  Customer customer, User createdBy) {
        BigDecimal remainingAmount = order.getTotalAmount().subtract(order.getPaidAmount());
        return new PaymentResponse(
                tx.getId(),
                tx.getTransactionCode(),
                order.getId(),
                order.getOrderCode(),
                customer.getId(),
                customer.getCustomerName(),
                tx.getAmount(),
                tx.getPaymentMethod(),
                tx.getReferenceNumber(),
                tx.getDescription(),
                tx.getTransactionType(),
                tx.getStatus().name(),
                order.getPaidAmount(),
                remainingAmount,
                order.getPaymentStatus().name(),
                tx.getBalanceAfter(),
                tx.getTransactionDate() != null ? tx.getTransactionDate() : tx.getCreatedAt(),
                createdBy.getUsername(),
                tx.getCreatedAt()
        );
    }

    private PaymentResponse buildPaymentResponseForHistory(DebtTransaction tx, SalesOrder order) {
        BigDecimal remainingAmount = order.getTotalAmount().subtract(order.getPaidAmount());
        String createdByUsername = tx.getCreatedBy() != null
                ? userRepository.findById(tx.getCreatedBy()).map(User::getUsername).orElse(null)
                : null;

        return new PaymentResponse(
                tx.getId(),
                tx.getTransactionCode(),
                order.getId(),
                order.getOrderCode(),
                tx.getCustomerId(),
                null,
                tx.getAmount(),
                tx.getPaymentMethod(),
                tx.getReferenceNumber(),
                tx.getDescription(),
                tx.getTransactionType(),
                tx.getStatus().name(),
                order.getPaidAmount(),
                remainingAmount,
                order.getPaymentStatus().name(),
                tx.getBalanceAfter(),
                tx.getTransactionDate() != null ? tx.getTransactionDate() : tx.getCreatedAt(),
                createdByUsername,
                tx.getCreatedAt()
        );
    }

    private PaymentResponse buildPaymentResponseForCustomerHistory(DebtTransaction tx) {
        String orderCode = null;
        String paymentStatus = null;
        BigDecimal paidAmount = null;
        BigDecimal remainingAmount = null;

        if (tx.getSalesOrderId() != null) {
            SalesOrder order = salesOrderRepository.findById(tx.getSalesOrderId()).orElse(null);
            if (order != null) {
                orderCode = order.getOrderCode();
                paymentStatus = order.getPaymentStatus().name();
                paidAmount = order.getPaidAmount();
                remainingAmount = order.getTotalAmount().subtract(order.getPaidAmount());
            }
        }

        String createdByUsername = tx.getCreatedBy() != null
                ? userRepository.findById(tx.getCreatedBy()).map(User::getUsername).orElse(null)
                : null;

        return new PaymentResponse(
                tx.getId(),
                tx.getTransactionCode(),
                tx.getSalesOrderId(),
                orderCode,
                tx.getCustomerId(),
                null,
                tx.getAmount(),
                tx.getPaymentMethod(),
                tx.getReferenceNumber(),
                tx.getDescription(),
                tx.getTransactionType(),
                tx.getStatus().name(),
                paidAmount,
                remainingAmount,
                paymentStatus,
                tx.getBalanceAfter(),
                tx.getTransactionDate() != null ? tx.getTransactionDate() : tx.getCreatedAt(),
                createdByUsername,
                tx.getCreatedAt()
        );
    }
}
