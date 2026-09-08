package com.hbdt.order.service;

import com.hbdt.entity.AccountingTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.AccountingTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import com.hbdt.order.dto.AccountingTransactionResponse;
import com.hbdt.order.dto.RevenueSummaryResponse;
import com.hbdt.repository.AccountingTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service ghi so ke toan tu dong -- HBDT-59 Automatic Sales Bookkeeping.
 *
 * <p>Cac write-method deu dung {@code propagation = MANDATORY}: bat buoc
 * phai duoc goi ben trong mot transaction dang chay (tu SalesOrderService).
 * Neu ghi so that bai thi toan bo transaction cua lenh tao/huy don se rollback,
 * dam bao tinh nhat quan giua bang sales_orders va accounting_transactions.</p>
 *
 * <h3>Idempotency</h3>
 * <ul>
 *   <li>Fast-path: existsByOrderId() truoc khi insert (tranh exception DB).</li>
 *   <li>Safety-net: UNIQUE index uk_accounting_transactions_order_id o tang DB
 *       chan moi race-condition con sot lai.</li>
 * </ul>
 */
@Service
public class SalesBookkeepingService {

    private static final Logger log = LoggerFactory.getLogger(SalesBookkeepingService.class);

    /** Trang thai don hang duoc ghi nhan vao so ke toan */
    private static final String BOOKKEEPING_ORDER_STATUS = "CONFIRMED";

    private final AccountingTransactionRepository accountingTransactionRepository;

    public SalesBookkeepingService(AccountingTransactionRepository accountingTransactionRepository) {
        this.accountingTransactionRepository = accountingTransactionRepository;
    }

    // -------------------------------------------------------------------------
    // Write: ghi so & dao but toan (chay trong TX cua SalesOrderService)
    // -------------------------------------------------------------------------

    /**
     * Ghi nhan doanh thu tu dong khi mot don hang duoc xac nhan.
     *
     * <p>Goi method nay ngay sau khi SalesOrder duoc luu thanh cong
     * voi status = "CONFIRMED". Method chay trong cung transaction
     * voi caller nho propagation = MANDATORY.</p>
     *
     * @param order don hang vua duoc xac nhan (da co id)
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordSaleFromOrder(SalesOrder order) {
        // -- State guard -------------------------------------------------------
        if (!BOOKKEEPING_ORDER_STATUS.equals(order.getStatus())) {
            log.warn("[Bookkeeping] Bo qua don hang #{} vi trang thai '{}' khong phai '{}'",
                    order.getId(), order.getStatus(), BOOKKEEPING_ORDER_STATUS);
            return;
        }

        // -- Idempotency fast-path ---------------------------------------------
        if (accountingTransactionRepository.existsByOrderId(order.getId())) {
            log.warn("[Bookkeeping] But toan cho don hang #{} da ton tai, bo qua de tranh ghi trung.",
                    order.getId());
            return;
        }

        // -- Tinh toan tien ---------------------------------------------------
        BigDecimal totalAmount = order.getTotalAmount();
        BigDecimal paidAmount  = order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal debtAmount  = totalAmount.subtract(paidAmount);

        // -- Xac dinh phuong thuc thanh toan ----------------------------------
        // SalesOrder hien tai khong luu paymentMethod rieng,
        // nen suy luan: neu con no -> DEBT, nguoc lai -> CASH.
        PaymentMethod paymentMethod = debtAmount.signum() > 0
                ? PaymentMethod.DEBT
                : PaymentMethod.CASH;

        // -- Tao va luu but toan ----------------------------------------------
        AccountingTransaction transaction = AccountingTransaction.builder()
                .businessId(order.getBusinessId())
                .orderId(order.getId())
                .customerId(order.getCustomerId())
                .transactionType(AccountingTransactionType.SALE)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .debtAmount(debtAmount)
                .paymentMethod(paymentMethod)
                .status(AccountingTransactionStatus.COMPLETED)
                .createdBy(order.getCreatedBy())
                .build();

        accountingTransactionRepository.save(transaction);

        log.info("[Bookkeeping] Da ghi so don hang #{} | total={} | paid={} | debt={} | method={}",
                order.getId(), totalAmount, paidAmount, debtAmount, paymentMethod);
    }

    /**
     * Dao but toan khi don hang bi huy -- doi status sang CANCELLED.
     *
     * <p>Chien luoc "doi trang thai" (Option A): but toan goc van duoc giu lai
     * trong DB, chi thay doi truong status. Bao cao thong ke se loc tru
     * cac but toan da bi huy.</p>
     *
     * @param orderId ID cua don hang vua bi huy
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void handleOrderCancellation(Long orderId) {
        accountingTransactionRepository.findByOrderId(orderId).ifPresentOrElse(
                transaction -> {
                    if (AccountingTransactionStatus.CANCELLED.equals(transaction.getStatus())) {
                        log.warn("[Bookkeeping] But toan cho don hang #{} da o trang thai CANCELLED, bo qua.",
                                orderId);
                        return;
                    }
                    transaction.setStatus(AccountingTransactionStatus.CANCELLED);
                    accountingTransactionRepository.save(transaction);
                    log.info("[Bookkeeping] Da huy but toan cho don hang #{}.", orderId);
                },
                () -> log.warn("[Bookkeeping] Khong tim thay but toan cho don hang #{} khi huy. Bo qua.",
                        orderId)
        );
    }

    // -------------------------------------------------------------------------
    // Read: cac query phuc vu API cho Frontend
    // -------------------------------------------------------------------------

    /**
     * Lay danh sach but toan COMPLETED cua ho kinh doanh theo khoang thoi gian (co phan trang).
     *
     * @param businessId ID ho kinh doanh
     * @param startDate  dau ky (inclusive), nullable
     * @param endDate    cuoi ky (inclusive), nullable
     * @param pageable   thong tin phan trang va sap xep
     * @return trang ket qua DTO
     */
    @Transactional(readOnly = true)
    public Page<AccountingTransactionResponse> getTransactions(
            Long businessId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        return accountingTransactionRepository
                .findByBusinessIdAndStatusAndCreatedAtBetween(
                        businessId,
                        AccountingTransactionStatus.COMPLETED,
                        startDate,
                        endDate,
                        pageable
                )
                .map(AccountingTransactionResponse::fromEntity);
    }

    /**
     * Tong hop doanh thu ho kinh doanh theo khoang thoi gian.
     *
     * <p>Su dung query tong hop 3 chi so trong mot round-trip DB duy nhat
     * nho sumRevenueByBusinessIdAndPeriod().</p>
     *
     * @param businessId ID ho kinh doanh
     * @param startDate  dau ky (inclusive)
     * @param endDate    cuoi ky (inclusive)
     * @return bao cao tong hop
     */
    @Transactional(readOnly = true)
    public RevenueSummaryResponse getRevenueSummary(
            Long businessId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        Object[] sums = accountingTransactionRepository
                .sumRevenueByBusinessIdAndPeriod(businessId, startDate, endDate);

        BigDecimal totalRevenue = sums[0] instanceof BigDecimal bd ? bd : BigDecimal.ZERO;
        BigDecimal totalPaid    = sums[1] instanceof BigDecimal bd ? bd : BigDecimal.ZERO;
        BigDecimal totalDebt    = sums[2] instanceof BigDecimal bd ? bd : BigDecimal.ZERO;

        long totalTransactions = accountingTransactionRepository
                .findByBusinessIdAndStatusAndCreatedAtBetween(
                        businessId,
                        AccountingTransactionStatus.COMPLETED,
                        startDate,
                        endDate,
                        Pageable.unpaged()
                )
                .getTotalElements();

        return new RevenueSummaryResponse(
                totalRevenue, totalPaid, totalDebt, totalTransactions, startDate, endDate);
    }
}