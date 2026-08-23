package com.hbdt.inventory.dto;

import java.math.BigDecimal;

public record InventoryMovementResponse(
        Long transactionId,
        Long productId,
        Long enteredUnitId,
        String enteredUnitName,
        BigDecimal enteredQuantity,
        BigDecimal conversionRate,
        Long baseUnitId,
        String baseUnitName,
        BigDecimal baseQuantity,
        BigDecimal balanceAfter,
        BigDecimal averageUnitCost,
        BigDecimal inventoryValue,
        String transactionType
) {
}
