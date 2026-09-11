package com.hbdt.revenue.dto;

import java.math.BigDecimal;

public record RevenueLedgerSummaryResponse(
        BigDecimal totalRevenue,
        BigDecimal totalPaid,
        BigDecimal totalDebt,
        BigDecimal totalImportCost,
        BigDecimal expectedProfit,
        BigDecimal actualProfit,
        BigDecimal totalQuantity,
        Long totalOrders,
        Long totalItems
) {
}
