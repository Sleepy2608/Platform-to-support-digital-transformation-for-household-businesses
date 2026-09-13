package com.hbdt.payment.service;

import com.hbdt.common.dto.PageResponse;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.debt.service.DebtBookkeepingService;
import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.DebtTransactionStatus;
import com.hbdt.entity.enums.DebtTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import com.hbdt.order.service.SalesOrderService;
import com.hbdt.payment.dto.CreatePaymentRequest;
import com.hbdt.payment.dto.CustomerDebtSummaryResponse;
import com.hbdt.payment.dto.OrderPaymentSummaryResponse;
import com.hbdt.payment.dto.PaymentResponse;
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
import java.util.List;

@Service
public class PaymentService {

    private final SalesOrderRepository salesOrderRepository;
    private final DebtTransactionRepository debtTransactionRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DebtBookkeepingService debtBookkeepingService;
    private final SalesOrderService salesOrderService;

    public PaymentService(SalesOrderRepository salesOrderRepository,
                          DebtTransactionRepository debtTransactionRepository,
                          CustomerRepository customerRepository,
                          UserRepository userRepository,
                          DebtBookkeepingService debtBookkeepingService,
                          SalesOrderService salesOrderService) {
        this.salesOrderRepository = salesOrderRepository;
        this.debtTransactionRepository = debtTransactionRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.debtBookkeepingService = debtBookkeepingService;
        this.salesOrderService = salesOrderService;
    }

    // ==================== Tạo giao dịch thanh toán ====================

    @Transactional
    public PaymentResponse createPayment(String username, CreatePaymentRequest request) {
        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        // 1. Validate và lock order (tránh race condition)
        SalesOrder order = salesOrderRepository.findForUpdateByIdAndBusinessId(request.salesOrderId(), businessId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc cửa hàng của bạn"));

        // 2. Parse payment method
        PaymentMethod method = parsePaymentMethod(request.paymentMethod());
        LocalDateTime paymentDate = request.paymentDate() != null ? request.paymentDate() : LocalDateTime.now();

        // 3. Hợp nhất: Ủy thác toàn bộ nghiệp vụ kiểm tra và khóa khách hàng cho SalesOrderService
        DebtTransaction transaction = salesOrderService.processOrderPayment(
                order, request.customerId(), user.getId(), businessId,
                request.amount(), method, request.referenceNumber(),
                paymentDate, request.note()
        );

        Customer customer = customerRepository.findById(transaction.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));

        // 4. Build response (order đã được cập nhật paidAmount / debtAmount / paymentStatus / lastPaymentAt)
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
        if (page < 0) throw new IllegalArgumentException("page phải >= 0");
        if (size < 1 || size > 100) throw new IllegalArgumentException("size phải trong khoảng 1–100");

        User user = findUserByUsername(username);
        Long businessId = user.getBusinessId();

        // Validate customer belongs to business
        customerRepository.findByIdAndBusinessId(customerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException(
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
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khách hàng hoặc khách hàng không thuộc cửa hàng của bạn"));

        BigDecimal totalDebt = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.DEBT_INCREASE.name());
        BigDecimal totalPaid = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.PAYMENT.name());
        BigDecimal totalVoided = debtTransactionRepository
                .sumAmountByCustomerIdAndType(customerId, businessId, DebtTransactionType.VOID.name());
        // Dùng calculateCustomerDebt (SSOT) để lấy số dư chính xác nhất
        BigDecimal currentBalance = debtBookkeepingService.calculateCustomerDebt(customerId, businessId);

        return new CustomerDebtSummaryResponse(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getCustomerName(),
                totalDebt,
                totalPaid,
                totalVoided,
                currentBalance
        );
    }

    // ==================== Helper methods ====================

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
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
        String customerName = tx.getCustomerId() != null
                ? customerRepository.findById(tx.getCustomerId()).map(Customer::getCustomerName).orElse(null)
                : null;

        return new PaymentResponse(
                tx.getId(),
                tx.getTransactionCode(),
                order.getId(),
                order.getOrderCode(),
                tx.getCustomerId(),
                customerName,
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
        String customerName = tx.getCustomerId() != null
                ? customerRepository.findById(tx.getCustomerId()).map(Customer::getCustomerName).orElse(null)
                : null;

        return new PaymentResponse(
                tx.getId(),
                tx.getTransactionCode(),
                tx.getSalesOrderId(),
                orderCode,
                tx.getCustomerId(),
                customerName,
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
