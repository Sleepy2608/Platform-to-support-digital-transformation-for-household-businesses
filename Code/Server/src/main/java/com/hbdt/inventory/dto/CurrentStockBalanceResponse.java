package com.hbdt.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CurrentStockBalanceResponse(
        Long productId,
        String productCode,
        String productName,
        Long categoryId,
        String categoryName,
        Long baseUnitId,
        String baseUnitName,
        BigDecimal quantityOnHand,
        BigDecimal averageUnitCost,
        BigDecimal inventoryValue,
        LocalDateTime updatedAt
) {
}
