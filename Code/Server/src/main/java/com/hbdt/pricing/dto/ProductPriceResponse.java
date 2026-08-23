package com.hbdt.pricing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductPriceResponse(
        Long id,
        Long productUnitId,
        Long unitId,
        String unitName,
        BigDecimal salePrice,
        String ruleName,
        String status,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        Long changedBy
) {
}
