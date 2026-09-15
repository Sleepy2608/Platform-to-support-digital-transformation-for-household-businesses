package com.hbdt.revenue.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BusinessOperationsReportResponse(
        LocalDate fromDate,
        LocalDate toDate,
        BigDecimal salesRevenue,
        BigDecimal cashCollected,
        BigDecimal debtIncurred,
        BigDecimal debtCollected,
        BigDecimal closingReceivables,
        BigDecimal stockPurchaseValue,
        BigDecimal netOperatingCashFlow,
        Long confirmedOrders,
        Long confirmedStockImports,
        String reportType,
        String reviewStatus,
        String reviewNote,
        String reviewedByName,
        LocalDateTime reviewedAt,
        String dataSignature
) {
}
