package com.hbdt.pricing.dto;

import java.math.BigDecimal;

public record ResolvedPriceResponse(
        Long productId,
        Long productUnitId,
        Long unitId,
        String unitName,
        BigDecimal quantity,
        BigDecimal conversionRate,
        BigDecimal baseQuantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        Long appliedPriceId,
        String appliedRuleName,
        boolean convertedFromBasePrice
) {
}
