package com.hbdt.inventory.dto;

import java.math.BigDecimal;

public record InventoryBalanceResponse(
        Long productId,
        Long baseUnitId,
        String baseUnitName,
        BigDecimal quantityOnHand,
        BigDecimal averageUnitCost,
        BigDecimal inventoryValue
) {
}
