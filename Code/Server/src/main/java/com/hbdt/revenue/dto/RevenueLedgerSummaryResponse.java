package com.hbdt.revenue.dto;

import java.math.BigDecimal;

public record RevenueLedgerSummaryResponse(
        BigDecimal totalRevenue,
        BigDecimal totalQuantity,
        Long totalOrders,
        Long totalItems
) {
}
