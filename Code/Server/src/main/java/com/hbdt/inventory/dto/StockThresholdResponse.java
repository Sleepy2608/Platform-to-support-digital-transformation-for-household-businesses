package com.hbdt.inventory.dto;

import java.math.BigDecimal;

public record StockThresholdResponse(
        Long productId,
        String productCode,
        String productName,
        BigDecimal quantityOnHand,
        BigDecimal minimumStock,
        boolean configured,
        boolean lowStock
) {
}
