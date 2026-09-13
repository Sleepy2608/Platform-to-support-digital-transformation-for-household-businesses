package com.hbdt.payment.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.debt.service.DebtBookkeepingService;
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
import com.hbdt.payment.dto.PaymentResponse;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.order.service.SalesOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private DebtTransactionRepository debtTransactionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private DebtBookkeepingService debtBookkeepingService;
    @Mock private SalesOrderService salesOrderService;

    private PaymentService service;

    @BeforeEach
    void setUp() {
        service = new PaymentService(
                salesOrderRepository, debtTransactionRepository, customerRepository,
                userRepository, debtBookkeepingService, salesOrderService);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC (original) – createPayment delegates to SalesOrderService and returns response
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createPayment delegates to SalesOrderService and synchronizes customer debt balance")
    void createPaymentSynchronizesCustomerDebtBalance() {
        User user = User.builder().id(7L).businessId(5L).username("owner").build();
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).customerName("Nguyễn Văn An")
                .debtBalance(new BigDecimal("175000")).status("ACTIVE").build();
        SalesOrder order = SalesOrder.builder()
                .id(100L).businessId(5L).customerId(22L).orderCode("SO-001")
                .status("CONFIRMED").totalAmount(new BigDecimal("300000"))
                .paidAmount(new BigDecimal("125000")).debtAmount(new BigDecimal("175000"))
                .paymentStatus(PaymentStatus.PARTIALLY_PAID).build();

        DebtTransaction transaction = DebtTransaction.builder()
                .id(1L)
                .transactionCode("DT-001")
                .salesOrderId(100L)
                .customerId(22L)
                .amount(new BigDecimal("75000"))
                .paymentMethod("CASH")
                .transactionType("PAYMENT")
                .status(DebtTransactionStatus.ACTIVE)
                .balanceAfter(new BigDecimal("175000"))
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(salesOrderService.processOrderPayment(
                eq(order), eq(22L), eq(7L), eq(5L), eq(new BigDecimal("75000")),
                eq(PaymentMethod.CASH), any(), any(), any()
        )).thenReturn(transaction);
        when(customerRepository.findById(22L)).thenReturn(Optional.of(customer));

        PaymentResponse response = service.createPayment("owner", new CreatePaymentRequest(
                100L, 22L, null, new BigDecimal("75000"), "CASH", null, null, null));

        verify(salesOrderService).processOrderPayment(
                eq(order), eq(22L), eq(7L), eq(5L), eq(new BigDecimal("75000")),
                eq(PaymentMethod.CASH), any(), any(), any()
        );
        assertThat(response).isNotNull();
        assertThat(response.amount()).isEqualByComparingTo("75000");
        assertThat(response.customerName()).isEqualTo("Nguyễn Văn An");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC13 – Truy vấn lịch sử chỉ trả về dữ liệu đúng business (tenant isolation)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC13 – getCustomerDebtSummary sử dụng businessId của user, không dùng businessId từ param")
    void tc13_debtSummaryEnforcesTenantIsolationViaUserBusinessId() {
        // User thuộc business 5
        User user = User.builder().id(7L).businessId(5L).username("owner").build();
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).customerName("Khách hàng A")
                .customerCode("KH-001").debtBalance(new BigDecimal("200000")).build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        // customerRepository phải được truy vấn với businessId = 5 (của user), không phải businessId khác
        when(customerRepository.findByIdAndBusinessId(22L, 5L)).thenReturn(Optional.of(customer));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(
                22L, 5L, DebtTransactionType.DEBT_INCREASE.name()))
                .thenReturn(new BigDecimal("500000"));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(
                22L, 5L, DebtTransactionType.PAYMENT.name()))
                .thenReturn(new BigDecimal("200000"));
        when(debtTransactionRepository.sumAmountByCustomerIdAndType(
                22L, 5L, DebtTransactionType.VOID.name()))
                .thenReturn(new BigDecimal("100000"));
        when(debtBookkeepingService.calculateCustomerDebt(22L, 5L))
                .thenReturn(new BigDecimal("200000.00"));

        CustomerDebtSummaryResponse summary = service.getCustomerDebtSummary("owner", 22L);

        assertThat(summary).isNotNull();
        assertThat(summary.customerId()).isEqualTo(22L);
        assertThat(summary.customerCode()).isEqualTo("KH-001");
        assertThat(summary.customerName()).isEqualTo("Khách hàng A");
        assertThat(summary.totalDebtIncreased()).isEqualByComparingTo("500000");
        assertThat(summary.totalPaid()).isEqualByComparingTo("200000");
        assertThat(summary.totalVoid()).isEqualByComparingTo("100000");
        assertThat(summary.currentBalance()).isEqualByComparingTo("200000.00");

        // Verify truy vấn luôn dùng businessId của user (5L), không phải hardcoded hay param khác
        verify(customerRepository).findByIdAndBusinessId(22L, 5L);
        verify(debtTransactionRepository).sumAmountByCustomerIdAndType(22L, 5L, "DEBT_INCREASE");
        verify(debtTransactionRepository).sumAmountByCustomerIdAndType(22L, 5L, "PAYMENT");
        verify(debtTransactionRepository).sumAmountByCustomerIdAndType(22L, 5L, "VOID");
        verify(debtBookkeepingService).calculateCustomerDebt(22L, 5L);
    }

    @Test
    @DisplayName("TC13b – getCustomerDebtSummary rejects customer not belonging to user's business")
    void tc13b_debtSummaryRejectsCustomerFromOtherBusiness() {
        // User thuộc business 5
        User user = User.builder().id(7L).businessId(5L).username("owner").build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        // Khách hàng không thuộc business 5 → repository trả về empty
        when(customerRepository.findByIdAndBusinessId(99L, 5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCustomerDebtSummary("owner", 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("TC13c – getCustomerPaymentHistory validates page and size params")
    void tc13c_paymentHistoryValidatesPageAndSize() {
        assertThatThrownBy(() -> service.getCustomerPaymentHistory("owner", 22L, -1, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("page");

        assertThatThrownBy(() -> service.getCustomerPaymentHistory("owner", 22L, 0, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("size");

        assertThatThrownBy(() -> service.getCustomerPaymentHistory("owner", 22L, 0, 200))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("size");
    }

    @Test
    @DisplayName("createPayment rejects order not found (not belonging to business)")
    void createPayment_orderNotFound_throws() {
        User user = User.builder().id(7L).businessId(5L).username("owner").build();
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(999L, 5L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createPayment("owner", new CreatePaymentRequest(
                999L, 22L, null, new BigDecimal("50000"), "CASH", null, null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createPayment rejects invalid payment method")
    void createPayment_invalidPaymentMethod_throws() {
        User user = User.builder().id(7L).businessId(5L).username("owner").build();
        SalesOrder order = SalesOrder.builder()
                .id(100L).businessId(5L).customerId(22L).orderCode("SO-001")
                .status("CONFIRMED").totalAmount(new BigDecimal("300000"))
                .paidAmount(new BigDecimal("100000")).debtAmount(new BigDecimal("200000"))
                .paymentStatus(PaymentStatus.PARTIALLY_PAID).build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L))
                .thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.createPayment("owner", new CreatePaymentRequest(
                100L, 22L, null, new BigDecimal("50000"), "INVALID_METHOD", null, null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Phương thức thanh toán không hợp lệ");
    }
}
