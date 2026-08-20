package com.hbdt.order.dto;

import java.math.BigDecimal;

public record SalesOrderItemResponse(
        Long id,
        Long productId,
        Long unitId,
        BigDecimal quantity,
        BigDecimal conversionRate,
        BigDecimal baseQuantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        Long productPriceId,
        String pricingRuleName
) {
}
