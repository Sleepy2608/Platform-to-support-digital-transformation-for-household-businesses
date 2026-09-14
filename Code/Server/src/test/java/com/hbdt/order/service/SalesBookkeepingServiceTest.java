package com.hbdt.order.service;

import com.hbdt.entity.AccountingTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.AccountingTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import com.hbdt.repository.AccountingTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests cho SalesBookkeepingService -- HBDT-59 Automatic Sales Bookkeeping.
 *
 * Tat ca dependency duoc mock bang Mockito, khong can Spring context.
 * Moi test case kiem tra mot kich ban nghiep vu doc lap.
 */
@ExtendWith(MockitoExtension.class)
class SalesBookkeepingServiceTest {

    @Mock
    private AccountingTransactionRepository accountingTransactionRepository;

    private SalesBookkeepingService service;

    @BeforeEach
    void setUp() {
        service = new SalesBookkeepingService(accountingTransactionRepository);
    }

    // -------------------------------------------------------------------------
    // recordSaleFromOrder -- ghi so doanh thu
    // -------------------------------------------------------------------------

    /**
     * TC-01: Don hang thanh toan du tien mat.
     * Ket qua mong doi: Luu AccountingTransaction voi type=SALE, status=COMPLETED,
     *                   debtAmount=0, paymentMethod=CASH.
     */
    @Test
    void recordSaleFromOrder_success_fullPayment() {
        // Given
        SalesOrder order = buildOrder(1L, "CONFIRMED",
                new BigDecimal("500000"), new BigDecimal("500000"), new BigDecimal("0"));
        when(accountingTransactionRepository.existsByOrderId(1L)).thenReturn(false);
        when(accountingTransactionRepository.save(any(AccountingTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        service.recordSaleFromOrder(order);

        // Then
        ArgumentCaptor<AccountingTransaction> captor =
                ArgumentCaptor.forClass(AccountingTransaction.class);
        verify(accountingTransactionRepository).save(captor.capture());

        AccountingTransaction saved = captor.getValue();
        assertThat(saved.getOrderId()).isEqualTo(1L);
        assertThat(saved.getBusinessId()).isEqualTo(10L);
        assertThat(saved.getTransactionType()).isEqualTo(AccountingTransactionType.SALE);
        assertThat(saved.getStatus()).isEqualTo(AccountingTransactionStatus.COMPLETED);
        assertThat(saved.getTotalAmount()).isEqualByComparingTo("500000");
        assertThat(saved.getPaidAmount()).isEqualByComparingTo("500000");
        assertThat(saved.getDebtAmount()).isEqualByComparingTo("0");
        assertThat(saved.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
    }

    /**
     * TC-02: Don hang mua no -- paidAmount < totalAmount.
     * Ket qua mong doi: debtAmount > 0 va paymentMethod = DEBT.
     */
    @Test
    void recordSaleFromOrder_success_withDebt() {
        // Given
        SalesOrder order = buildOrder(2L, "CONFIRMED",
                new BigDecimal("300000"), new BigDecimal("100000"), new BigDecimal("200000"));
        when(accountingTransactionRepository.existsByOrderId(2L)).thenReturn(false);
        when(accountingTransactionRepository.save(any(AccountingTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        service.recordSaleFromOrder(order);

        // Then
        ArgumentCaptor<AccountingTransaction> captor =
                ArgumentCaptor.forClass(AccountingTransaction.class);
        verify(accountingTransactionRepository).save(captor.capture());

        AccountingTransaction saved = captor.getValue();
        assertThat(saved.getTotalAmount()).isEqualByComparingTo("300000");
        assertThat(saved.getPaidAmount()).isEqualByComparingTo("100000");
        assertThat(saved.getDebtAmount()).isEqualByComparingTo("200000");
        assertThat(saved.getPaymentMethod()).isEqualTo(PaymentMethod.DEBT);
        assertThat(saved.getStatus()).isEqualTo(AccountingTransactionStatus.COMPLETED);
        assertThat(saved.getTransactionType()).isEqualTo(AccountingTransactionType.SALE);
    }

    /**
     * TC-03: Idempotency -- goi method 2 lan cung orderId (existsByOrderId = true).
     * Ket qua mong doi: Khong goi accountingTransactionRepository.save(), khong co exception.
     */
    @Test
    void recordSaleFromOrder_idempotency_skipsDuplicate() {
        // Given
        SalesOrder order = buildOrder(3L, "CONFIRMED",
                new BigDecimal("200000"), new BigDecimal("200000"), BigDecimal.ZERO);
        when(accountingTransactionRepository.existsByOrderId(3L)).thenReturn(true);

        // When
        service.recordSaleFromOrder(order);

        // Then: save khong duoc goi vi da ton tai
        verify(accountingTransactionRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // handleOrderCancellation -- huy but toan
    // -------------------------------------------------------------------------

    /**
     * TC-04: Huy don hang thanh cong.
     * Ket qua mong doi: Tim thay transaction COMPLETED va doi status -> CANCELLED.
     */
    @Test
    void handleOrderCancellation_success() {
        // Given
        AccountingTransaction existing = AccountingTransaction.builder()
                .id(99L)
                .orderId(4L)
                .businessId(10L)
                .status(AccountingTransactionStatus.COMPLETED)
                .transactionType(AccountingTransactionType.SALE)
                .totalAmount(new BigDecimal("150000"))
                .paidAmount(new BigDecimal("150000"))
                .debtAmount(BigDecimal.ZERO)
                .paymentMethod(PaymentMethod.CASH)
                .createdBy(7L)
                .build();
        when(accountingTransactionRepository.findByOrderId(4L)).thenReturn(Optional.of(existing));
        when(accountingTransactionRepository.save(any(AccountingTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        service.handleOrderCancellation(4L);

        // Then
        ArgumentCaptor<AccountingTransaction> captor =
                ArgumentCaptor.forClass(AccountingTransaction.class);
        verify(accountingTransactionRepository).save(captor.capture());

        AccountingTransaction saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(99L);
        assertThat(saved.getStatus()).isEqualTo(AccountingTransactionStatus.CANCELLED);
    }

    /**
     * TC-05: Huy don hang voi orderId khong ton tai trong bang ke toan.
     * Ket qua mong doi: Khong nem exception, khong goi save.
     */
    @Test
    void handleOrderCancellation_notFound() {
        // Given
        when(accountingTransactionRepository.findByOrderId(99L)).thenReturn(Optional.empty());

        // When -- phai xu ly an toan, khong throw exception
        service.handleOrderCancellation(99L);

        // Then
        verify(accountingTransactionRepository, never()).save(any());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private SalesOrder buildOrder(Long id, String status,
                                  BigDecimal total, BigDecimal paid, BigDecimal debt) {
        return SalesOrder.builder()
                .id(id)
                .businessId(10L)
                .createdBy(7L)
                .customerId(null)
                .orderCode("SO-00" + id)
                .source("POS")
                .status(status)
                .totalAmount(total)
                .paidAmount(paid)
                .debtAmount(debt)
                .build();
    }
}