package com.hbdt.revenue.dto;

import java.math.BigDecimal;

public record RevenueLedgerSummaryResponse(
        BigDecimal totalRevenue,
        BigDecimal totalImportCost,
        BigDecimal netRevenue,
        BigDecimal totalQuantity,
        Long totalOrders,
        Long totalItems
) {
}
