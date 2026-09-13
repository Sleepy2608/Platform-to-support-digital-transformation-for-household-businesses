package com.hbdt.debt.service;

import com.hbdt.common.exception.BadRequestException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Bộ test toàn diện cho HBDT-66 Automatic Debt Bookkeeping.
 *
 * <p>Bao phủ 15 kịch bản nghiệp vụ bắt buộc:
 * TC1  – Tạo đơn thanh toán đủ: không tạo DebtTransaction.
 * TC2  – Tạo đơn mua chịu toàn bộ: tạo DEBT_INCREASE đúng totalAmount.
 * TC3  – Tạo đơn trả một phần: debtAmount = totalAmount − paidAmount.
 * TC4  – Hai đơn mua chịu cùng khách hàng: số dư tích lũy đúng.
 * TC5  – Thanh toán một phần: số dư khách hàng và debtAmount của đơn cùng giảm.
 * TC6  – Thanh toán toàn bộ: paymentStatus = PAID, debtAmount = 0.
 * TC7  – Thanh toán vượt số nợ còn lại của đơn: bị từ chối.
 * TC8  – Thanh toán vượt tổng công nợ khách hàng: bị từ chối.
 * TC9  – Hủy đơn có công nợ: tạo VOID đúng phần còn nợ.
 * TC10 – Hủy đơn lần hai (idempotency): không tạo thêm giao dịch mới.
 * TC11 – Request tạo DEBT_INCREASE gửi lặp lại: idempotency, không tạo trùng.
 * TC12 – Thanh toán vượt quá tổng nợ khách hàng (concurrent-like): số dư không âm.
 * TC13 – (Xem PaymentServiceTest) Truy vấn lịch sử chỉ trả đúng business.
 * TC14 – Customer.debtBalance khớp với số dư tính từ DebtTransaction ACTIVE.
 * TC15 – Enum DebtTransactionType chỉ có các giá trị hợp lệ theo thiết kế.
 */
@ExtendWith(MockitoExtension.class)
class DebtBookkeepingServiceTest {

    @Mock private DebtTransactionRepository debtTransactionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SalesOrderRepository salesOrderRepository;

    private DebtBookkeepingService service;

    private final Long businessId = 1L;
    private final Long customerId = 10L;
    private final Long actorId    = 99L;

    @BeforeEach
    void setUp() {
        service = new DebtBookkeepingService(
                debtTransactionRepository,
                customerRepository,
                salesOrderRepository
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // calculateCustomerDebt (query)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("calculateCustomerDebt returns balance from ledger aggregate")
    void calculateCustomerDebt_returnsFromLedger() {
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("150000.00"));

        BigDecimal balance = service.calculateCustomerDebt(customerId, businessId);

        assertThat(balance).isEqualByComparingTo("150000.00");
    }

    @Test
    @DisplayName("calculateCustomerDebt falls back to customer entity when ledger balance is null")
    void calculateCustomerDebt_fallsBackToCustomer() {
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(null);
        Customer customer = Customer.builder()
                .id(customerId)
                .businessId(businessId)
                .debtBalance(new BigDecimal("80000.00"))
                .build();
        when(customerRepository.findByIdAndBusinessId(customerId, businessId))
                .thenReturn(Optional.of(customer));

        BigDecimal balance = service.calculateCustomerDebt(customerId, businessId);

        assertThat(balance).isEqualByComparingTo("80000.00");
    }

    @Test
    @DisplayName("calculateCustomerDebt returns 0 when null IDs passed")
    void calculateCustomerDebt_nullIds() {
        BigDecimal balance = service.calculateCustomerDebt(null, null);
        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC14 – Customer.debtBalance khớp với số dư tính từ DebtTransaction ACTIVE
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC14 – Customer.debtBalance sau recordDebtIncrease khớp với ledger balance")
    void tc14_customerDebtBalanceMatchesLedger() {
        SalesOrder order = order(200L, "SO-200", "300000", "0", "300000");
        Customer customer = customer("0");

        stubNoExistingDebtIncrease(200L);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(BigDecimal.ZERO.setScale(2));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.recordDebtIncrease(order, customer, actorId, new BigDecimal("300000"));

        // Sau khi ghi nợ, debtBalance phải bằng đúng 300000 (= balanceAfter trong transaction)
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("300000.00");

        // Verify customer được lưu với balance mới
        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());
        assertThat(captor.getValue().getDebtBalance()).isEqualByComparingTo("300000.00");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC15 – Enum DebtTransactionType chỉ có 4 giá trị hợp lệ
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC15 – DebtTransactionType enum chỉ chứa DEBT_INCREASE, PAYMENT, ADJUSTMENT, VOID")
    void tc15_enumValuesAreExactlyFour() {
        DebtTransactionType[] values = DebtTransactionType.values();
        assertThat(values).containsExactlyInAnyOrder(
                DebtTransactionType.DEBT_INCREASE,
                DebtTransactionType.PAYMENT,
                DebtTransactionType.ADJUSTMENT,
                DebtTransactionType.VOID
        );
        // Đảm bảo không tồn tại DEBT_PAYMENT hoặc DEBT_REVERSAL
        assertThat(values).doesNotContain(
                (DebtTransactionType) null
        );
        for (DebtTransactionType type : values) {
            assertThat(type.name())
                    .doesNotContain("DEBT_PAYMENT")
                    .doesNotContain("DEBT_REVERSAL");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC1 – Tạo đơn thanh toán đủ: recordDebtIncrease không được gọi
    // (Nghiệp vụ được test ở SalesOrderServiceTest; ở đây test service layer)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC1 – recordDebtIncrease trả về null khi debtAmount = 0")
    void tc1_recordDebtIncreaseWithZeroAmountReturnsNull() {
        SalesOrder order = order(101L, "SO-101", "100000", "100000", "0");
        Customer customer = customer("0");

        DebtTransaction result = service.recordDebtIncrease(order, customer, actorId, BigDecimal.ZERO);

        assertThat(result).isNull();
        verify(debtTransactionRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC1b – recordDebtIncrease trả về null khi debtAmount âm")
    void tc1b_recordDebtIncreaseWithNegativeAmountReturnsNull() {
        SalesOrder order = order(101L, "SO-101", "100000", "100000", "0");
        Customer customer = customer("0");

        DebtTransaction result = service.recordDebtIncrease(order, customer, actorId, new BigDecimal("-1000"));

        assertThat(result).isNull();
        verify(debtTransactionRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC2 – Tạo đơn mua chịu toàn bộ: DEBT_INCREASE đúng totalAmount
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC2 – recordDebtIncrease tạo giao dịch DEBT_INCREASE với đúng totalAmount")
    void tc2_fullDebtCreatesDebtIncreaseTransaction() {
        SalesOrder order = order(102L, "SO-102", "200000", "0", "200000");
        Customer customer = customer("0");

        stubNoExistingDebtIncrease(102L);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(BigDecimal.ZERO.setScale(2));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordDebtIncrease(order, customer, actorId, new BigDecimal("200000"));

        assertThat(result).isNotNull();
        assertThat(result.getTransactionType()).isEqualTo(DebtTransactionType.DEBT_INCREASE.name());
        assertThat(result.getAmount()).isEqualByComparingTo("200000.00");
        assertThat(result.getBalanceAfter()).isEqualByComparingTo("200000.00");
        assertThat(result.getStatus()).isEqualTo(DebtTransactionStatus.ACTIVE);
        assertThat(result.getBusinessId()).isEqualTo(businessId);
        assertThat(result.getCustomerId()).isEqualTo(customerId);
        assertThat(result.getSalesOrderId()).isEqualTo(102L);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC3 – Tạo đơn trả một phần: debtAmount = totalAmount − paidAmount
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC3 – recordDebtIncrease ghi đúng phần nợ phát sinh (total - paid)")
    void tc3_partialPaymentCreatesCorrectDebtAmount() {
        // total = 500000, paid = 200000 → debt = 300000
        SalesOrder order = order(103L, "SO-103", "500000", "200000", "300000");
        Customer customer = customer("0");

        stubNoExistingDebtIncrease(103L);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(BigDecimal.ZERO.setScale(2));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordDebtIncrease(order, customer, actorId, new BigDecimal("300000"));

        assertThat(result.getAmount()).isEqualByComparingTo("300000.00");
        assertThat(result.getBalanceAfter()).isEqualByComparingTo("300000.00");
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("300000.00");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC4 – Hai đơn mua chịu cùng khách hàng: số dư tích lũy
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC4 – Hai lần recordDebtIncrease tích lũy số dư đúng cho cùng khách hàng")
    void tc4_twoOrdersSameCustomerAccumulatesBalance() {
        // Đơn 1: nợ 300000
        SalesOrder order1 = order(104L, "SO-104", "300000", "0", "300000");
        Customer customer = customer("0");

        // Đơn 1
        stubNoExistingDebtIncrease(104L);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(BigDecimal.ZERO.setScale(2));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction tx1 = service.recordDebtIncrease(order1, customer, actorId, new BigDecimal("300000"));

        assertThat(tx1.getBalanceAfter()).isEqualByComparingTo("300000.00");
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("300000.00");

        // Đơn 2: nợ 500000, khách hàng đã có 300000 từ đơn 1
        SalesOrder order2 = order(105L, "SO-105", "700000", "200000", "500000");

        stubNoExistingDebtIncrease(105L);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("300000.00"));

        DebtTransaction tx2 = service.recordDebtIncrease(order2, customer, actorId, new BigDecimal("500000"));

        // Số dư sau đơn 2 = 300000 + 500000 = 800000
        assertThat(tx2.getBalanceAfter()).isEqualByComparingTo("800000.00");
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("800000.00");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC5 – Thanh toán một phần: debtAmount và số dư khách hàng cùng giảm
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC5 – recordPayment một phần: order.debtAmount và customer.debtBalance cùng giảm đúng")
    void tc5_partialPaymentReducesBalanceAndOrderDebt() {
        SalesOrder order = confirmedOrder(200L, "SO-200",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.recordPayment(order, customer, actorId,
                new BigDecimal("80000"), PaymentMethod.CASH, null, null, null);

        // order được cập nhật đúng
        assertThat(order.getPaidAmount()).isEqualByComparingTo("180000.00");
        assertThat(order.getDebtAmount()).isEqualByComparingTo("120000.00");
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIALLY_PAID);

        // customer được cập nhật đúng
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("120000.00");

        // Phải lưu cả order và customer
        verify(salesOrderRepository).save(order);
        verify(customerRepository).save(customer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC6 – Thanh toán toàn bộ: status PAID, debtAmount = 0
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC6 – recordPayment toàn bộ: paymentStatus = PAID, debtAmount = 0")
    void tc6_fullPaymentSetsPaidStatus() {
        SalesOrder order = confirmedOrder(201L, "SO-201",
                "500000", "200000", "300000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("300000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("300000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction tx = service.recordPayment(order, customer, actorId,
                new BigDecimal("300000"), PaymentMethod.CASH, null, null, "Trả hết nợ");

        assertThat(tx.getTransactionType()).isEqualTo(DebtTransactionType.PAYMENT.name());
        assertThat(tx.getAmount()).isEqualByComparingTo("300000.00");
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getDebtAmount()).isEqualByComparingTo("0.00");
        assertThat(order.getPaidAmount()).isEqualByComparingTo("500000.00");
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("0.00");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC7 – Thanh toán vượt số nợ còn lại của đơn hàng
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC7 – recordPayment vượt số nợ còn lại của đơn: BadRequestException")
    void tc7_paymentExceedsOrderDebtIsRejected() {
        SalesOrder order = confirmedOrder(202L, "SO-202",
                "300000", "200000", "100000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("100000");

        assertThatThrownBy(() -> service.recordPayment(order, customer, actorId,
                new BigDecimal("150000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá số tiền còn phải trả");

        // Không được lưu gì khi bị từ chối
        verify(debtTransactionRepository, never()).save(any());
        verify(salesOrderRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC8 – Thanh toán vượt tổng công nợ khách hàng
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC8 – recordPayment vượt tổng công nợ khách hàng: BadRequestException")
    void tc8_paymentExceedsCustomerTotalDebtIsRejected() {
        // Đơn hàng cho phép thanh toán tới 500000,
        // nhưng customer.debtBalance chỉ còn 200000 (vì đã trả nhiều đơn khác)
        SalesOrder order = confirmedOrder(203L, "SO-203",
                "600000", "100000", "500000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000"); // Tổng nợ khách chỉ còn 200000

        // calculateCustomerDebt trả về 200000 (từ ledger)
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));

        // Cố thanh toán 300000 (vượt 200000 tổng nợ khách hàng)
        assertThatThrownBy(() -> service.recordPayment(order, customer, actorId,
                new BigDecimal("300000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá tổng công nợ hiện tại");

        verify(debtTransactionRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC9 – Hủy đơn có công nợ: tạo VOID đúng phần còn nợ
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC9 – recordDebtVoid tạo giao dịch VOID đúng debtAmount còn lại")
    void tc9_cancelWithDebtCreatesVoidTransaction() {
        SalesOrder order = order(300L, "SO-300", "400000", "100000", "300000");
        Customer customer = customer("300000");

        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                300L, businessId, "VOID", DebtTransactionStatus.ACTIVE))
                .thenReturn(false);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("300000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordDebtVoid(order, customer, actorId, "Khách hủy đơn");

        assertThat(result).isNotNull();
        assertThat(result.getTransactionType()).isEqualTo(DebtTransactionType.VOID.name());
        assertThat(result.getAmount()).isEqualByComparingTo("300000.00");
        assertThat(result.getBalanceAfter()).isEqualByComparingTo("0.00");
        assertThat(result.getStatus()).isEqualTo(DebtTransactionStatus.ACTIVE);
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("0.00");
        // order.debtAmount phải được set về 0 sau khi đảo nợ
        assertThat(order.getDebtAmount()).isEqualByComparingTo("0.00");
        verify(customerRepository).save(customer);
        verify(salesOrderRepository).save(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC10 – Hủy đơn lần hai: idempotency – không tạo giao dịch mới
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC10 – recordDebtVoid lần hai trả về giao dịch cũ, không tạo mới")
    void tc10_secondVoidIsIdempotent() {
        SalesOrder order = order(301L, "SO-301", "300000", "0", "300000");
        Customer customer = customer("300000");

        DebtTransaction existingVoid = DebtTransaction.builder()
                .id(50L)
                .transactionType(DebtTransactionType.VOID.name())
                .amount(new BigDecimal("300000.00"))
                .balanceAfter(BigDecimal.ZERO.setScale(2))
                .status(DebtTransactionStatus.ACTIVE)
                .businessId(businessId)
                .customerId(customerId)
                .salesOrderId(301L)
                .build();

        // Đã tồn tại VOID transaction
        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                301L, businessId, "VOID", DebtTransactionStatus.ACTIVE))
                .thenReturn(true);
        when(debtTransactionRepository.findBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                301L, businessId, "VOID", DebtTransactionStatus.ACTIVE))
                .thenReturn(Optional.of(existingVoid));

        DebtTransaction result = service.recordDebtVoid(order, customer, actorId, "Hủy lại lần hai");

        // Phải trả về giao dịch cũ, không tạo mới
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(50L);
        // Không được tạo thêm bất kỳ transaction nào
        verify(debtTransactionRepository, never()).save(any());
        // Không được thay đổi customer balance
        verify(customerRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC11 – Request tạo DEBT_INCREASE gửi lặp lại: idempotency
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC11 – recordDebtIncrease gửi lại: trả về giao dịch cũ, không tạo trùng")
    void tc11_duplicateDebtIncreaseRequestIsIdempotent() {
        SalesOrder order = order(400L, "SO-400", "500000", "0", "500000");
        Customer customer = customer("500000");

        DebtTransaction existingIncrease = DebtTransaction.builder()
                .id(70L)
                .transactionType(DebtTransactionType.DEBT_INCREASE.name())
                .amount(new BigDecimal("500000.00"))
                .balanceAfter(new BigDecimal("500000.00"))
                .status(DebtTransactionStatus.ACTIVE)
                .businessId(businessId)
                .customerId(customerId)
                .salesOrderId(400L)
                .build();

        // Đã tồn tại DEBT_INCREASE transaction
        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                400L, businessId, "DEBT_INCREASE", DebtTransactionStatus.ACTIVE))
                .thenReturn(true);
        when(debtTransactionRepository.findBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                400L, businessId, "DEBT_INCREASE", DebtTransactionStatus.ACTIVE))
                .thenReturn(Optional.of(existingIncrease));

        DebtTransaction result = service.recordDebtIncrease(order, customer, actorId, new BigDecimal("500000"));

        // Phải trả về giao dịch cũ, không tạo thêm
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(70L);
        verify(debtTransactionRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TC12 – Thanh toán dẫn đến số dư âm: bị từ chối (concurrent-safety)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC12 – recordPayment không cho phép số dư khách hàng âm (concurrent guard)")
    void tc12_paymentCannotMakeCustomerBalanceNegative() {
        // Đơn hàng nợ 200000, nhưng calculateCurrentBalance chỉ còn 150000
        // (do request khác đã thanh toán một phần trước đó)
        SalesOrder order = confirmedOrder(500L, "SO-500",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("150000.00"));

        // Cố thanh toán 200000 (> balance thực tế 150000)
        assertThatThrownBy(() -> service.recordPayment(order, customer, actorId,
                new BigDecimal("200000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá tổng công nợ hiện tại");

        // Không được persist gì
        verify(debtTransactionRepository, never()).save(any());
        verify(customerRepository, never()).save(any());
        verify(salesOrderRepository, never()).save(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Các test bổ sung từ bộ test gốc
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("recordDebtIncrease throws when tenant mismatch")
    void recordDebtIncrease_tenantMismatch() {
        SalesOrder order = SalesOrder.builder().id(100L).businessId(1L).customerId(customerId).build();
        Customer customer = Customer.builder().id(customerId).businessId(2L).build();

        assertThatThrownBy(() ->
                service.recordDebtIncrease(order, customer, actorId, new BigDecimal("100000.00")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("tenant isolation");
    }

    @Test
    @DisplayName("recordPayment records PAYMENT and updates order and customer")
    void recordPayment_success() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordPayment(
                order, customer, actorId, new BigDecimal("150000.00"),
                PaymentMethod.CASH, null, LocalDateTime.now(), "Trả bớt tiền");

        assertThat(result).isNotNull();
        assertThat(result.getTransactionType()).isEqualTo(DebtTransactionType.PAYMENT.name());
        assertThat(result.getAmount()).isEqualByComparingTo("150000.00");
        assertThat(result.getBalanceAfter()).isEqualByComparingTo("50000.00");

        assertThat(order.getPaidAmount()).isEqualByComparingTo("250000.00");
        assertThat(order.getDebtAmount()).isEqualByComparingTo("50000.00");
        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PARTIALLY_PAID);
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("50000.00");

        verify(salesOrderRepository).save(order);
        verify(customerRepository).save(customer);
    }

    @Test
    @DisplayName("recordPayment marks order as PAID when paid in full")
    void recordPayment_paidInFull() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.recordPayment(order, customer, actorId, new BigDecimal("200000.00"),
                PaymentMethod.CASH, null, LocalDateTime.now(), "Trả hết");

        assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(order.getDebtAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(customer.getDebtBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("recordPayment rejects payment when amount exceeds order remaining")
    void recordPayment_exceedsRemaining() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "200000", "100000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("100000");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, new BigDecimal("150000.00"),
                PaymentMethod.CASH, null, LocalDateTime.now(), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá số tiền còn phải trả");
    }

    @Test
    @DisplayName("recordDebtVoid records VOID transaction and reverses customer debt")
    void recordDebtVoid_success() {
        SalesOrder order = order(100L, "SO-100", "300000", "100000", "200000");
        Customer customer = customer("200000");

        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                100L, businessId, "VOID", DebtTransactionStatus.ACTIVE))
                .thenReturn(false);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordDebtVoid(order, customer, actorId, "Hủy đơn hàng");

        assertThat(result).isNotNull();
        assertThat(result.getTransactionType()).isEqualTo(DebtTransactionType.VOID.name());
        assertThat(result.getAmount()).isEqualByComparingTo("200000.00");
        assertThat(result.getBalanceAfter()).isEqualByComparingTo("0.00");
        assertThat(customer.getDebtBalance()).isEqualByComparingTo("0.00");
        verify(customerRepository).save(customer);
    }

    @Test
    @DisplayName("recordDebtVoid returns null when order has no debt")
    void recordDebtVoid_noDebt_returnsNull() {
        SalesOrder order = order(100L, "SO-100", "300000", "300000", "0");
        Customer customer = customer("0");

        DebtTransaction result = service.recordDebtVoid(order, customer, actorId, "Không có nợ");

        assertThat(result).isNull();
        verify(debtTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("recordDebtVoid throws when balance would go negative (data inconsistency)")
    void recordDebtVoid_negativeBalance_throws() {
        // Đơn nợ 200000 nhưng ledger chỉ còn 100000 (inconsistent state)
        SalesOrder order = order(100L, "SO-100", "300000", "100000", "200000");
        Customer customer = customer("100000");

        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                100L, businessId, "VOID", DebtTransactionStatus.ACTIVE))
                .thenReturn(false);
        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("100000.00")); // chỉ còn 100k

        assertThatThrownBy(() -> service.recordDebtVoid(order, customer, actorId, "Hủy đơn"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Dữ liệu công nợ không nhất quán");
    }

    @Test
    @DisplayName("recordPayment requires bank transfer reference number")
    void recordPayment_bankTransferRequiresReferenceNumber() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, new BigDecimal("50000"),
                PaymentMethod.BANK_TRANSFER, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("referenceNumber");
    }

    @Test
    @DisplayName("recordPayment with bank transfer and reference number succeeds")
    void recordPayment_bankTransferWithReference_succeeds() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        when(debtTransactionRepository.calculateCurrentBalance(customerId, businessId))
                .thenReturn(new BigDecimal("200000.00"));
        when(debtTransactionRepository.save(any(DebtTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DebtTransaction result = service.recordPayment(
                order, customer, actorId, new BigDecimal("50000"),
                PaymentMethod.BANK_TRANSFER, "REF-2026-001", null, null);

        assertThat(result).isNotNull();
        assertThat(result.getPaymentMethod()).isEqualTo("BANK_TRANSFER");
        assertThat(result.getReferenceNumber()).isEqualTo("REF-2026-001");
    }

    @Test
    @DisplayName("recordPayment rejects when amount is zero or negative")
    void recordPayment_zeroOrNegativeAmount_throws() {
        SalesOrder order = confirmedOrder(100L, "SO-100",
                "300000", "100000", "200000", PaymentStatus.PARTIALLY_PAID);
        Customer customer = customer("200000");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, BigDecimal.ZERO, PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("phải lớn hơn 0");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, new BigDecimal("-1000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("phải lớn hơn 0");
    }

    @Test
    @DisplayName("recordPayment rejects when order is not CONFIRMED")
    void recordPayment_notConfirmedOrder_throws() {
        SalesOrder order = SalesOrder.builder()
                .id(100L)
                .orderCode("SO-100")
                .businessId(businessId)
                .customerId(customerId)
                .status("CANCELLED")  // không phải CONFIRMED
                .totalAmount(new BigDecimal("300000"))
                .paidAmount(new BigDecimal("100000"))
                .paymentStatus(PaymentStatus.PARTIALLY_PAID)
                .build();
        Customer customer = customer("200000");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, new BigDecimal("50000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("CONFIRMED");
    }

    @Test
    @DisplayName("recordPayment rejects when order is already fully PAID")
    void recordPayment_alreadyPaid_throws() {
        SalesOrder order = SalesOrder.builder()
                .id(100L)
                .orderCode("SO-100")
                .businessId(businessId)
                .customerId(customerId)
                .status("CONFIRMED")
                .totalAmount(new BigDecimal("300000"))
                .paidAmount(new BigDecimal("300000"))
                .paymentStatus(PaymentStatus.PAID)
                .build();
        Customer customer = customer("0");

        assertThatThrownBy(() -> service.recordPayment(
                order, customer, actorId, new BigDecimal("1000"), PaymentMethod.CASH, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được thanh toán đầy đủ");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Tạo SalesOrder đơn giản (không set status, dùng cho recordDebtIncrease/recordDebtVoid) */
    private SalesOrder order(Long id, String code, String total, String paid, String debt) {
        return SalesOrder.builder()
                .id(id)
                .orderCode(code)
                .businessId(businessId)
                .customerId(customerId)
                .totalAmount(new BigDecimal(total))
                .paidAmount(new BigDecimal(paid))
                .debtAmount(new BigDecimal(debt))
                .build();
    }

    /** Tạo SalesOrder ở trạng thái CONFIRMED (dùng cho recordPayment) */
    private SalesOrder confirmedOrder(Long id, String code,
            String total, String paid, String debt, PaymentStatus paymentStatus) {
        SalesOrder order = order(id, code, total, paid, debt);
        order.setStatus("CONFIRMED");
        order.setPaymentStatus(paymentStatus);
        return order;
    }

    /** Tạo Customer với debtBalance cho sẵn */
    private Customer customer(String debtBalance) {
        return Customer.builder()
                .id(customerId)
                .businessId(businessId)
                .customerName("Khách hàng test")
                .debtBalance(new BigDecimal(debtBalance))
                .status("ACTIVE")
                .build();
    }

    /** Stub để báo hiệu chưa có giao dịch DEBT_INCREASE cho đơn hàng */
    private void stubNoExistingDebtIncrease(Long orderId) {
        when(debtTransactionRepository.existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
                orderId, businessId, "DEBT_INCREASE", DebtTransactionStatus.ACTIVE))
                .thenReturn(false);
    }
}
