package com.hbdt.inventory.dto;

import java.util.List;

public record LowStockSummaryResponse(
        long totalLowStock,
        List<LowStockAlertResponse> products
) {
}
