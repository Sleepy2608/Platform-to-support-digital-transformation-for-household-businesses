package com.hbdt.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Bao cao tong hop doanh thu theo ky -- HBDT-59.
 *
 * @param totalRevenue     Tong doanh thu (SUM totalAmount cac giao dich COMPLETED type=SALE)
 * @param totalPaid        Tong tien da thu (SUM paidAmount)
 * @param totalDebt        Tong cong no phat sinh (SUM debtAmount)
 * @param totalTransactions So luong but toan trong ky
 * @param startDate        Dau ky bao cao
 * @param endDate          Cuoi ky bao cao
 */
public record RevenueSummaryResponse(
        BigDecimal totalRevenue,
        BigDecimal totalPaid,
        BigDecimal totalDebt,
        long totalTransactions,
        LocalDateTime startDate,
        LocalDateTime endDate
) {
}