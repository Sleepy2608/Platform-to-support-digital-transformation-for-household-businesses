package com.hbdt.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LowStockAlertResponse(
        Long id,
        Long productId,
        String productCode,
        String productName,
        BigDecimal quantityOnHand,
        BigDecimal minimumStock,
        String status,
        boolean needsRestock,
        LocalDateTime triggeredAt,
        LocalDateTime lastDetectedAt,
        LocalDateTime resolvedAt
) {
}
