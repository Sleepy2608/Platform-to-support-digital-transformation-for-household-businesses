package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record InventoryAdjustmentResponse(
        Long transactionId,
        Long productId,
        String productName,
        String productCode,
        Long enteredUnitId,
        String enteredUnitName,
        BigDecimal enteredQuantity,
        BigDecimal conversionRate,
        Long baseUnitId,
        String baseUnitName,
        BigDecimal baseQuantity,
        BigDecimal quantityChange,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        BigDecimal unitCost,
        BigDecimal transactionValue,
        BigDecimal balanceValue,
        String adjustmentType,
        String reason,
        Long adjustedById,
        String adjustedByUsername,
        LocalDateTime adjustedAt
) {}
