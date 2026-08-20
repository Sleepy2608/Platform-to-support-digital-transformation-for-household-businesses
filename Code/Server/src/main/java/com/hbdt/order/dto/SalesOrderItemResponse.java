package com.hbdt.order.dto;

import java.math.BigDecimal;

public record SalesOrderItemResponse(
        Long id,
        Long productId,
        String productName,
        Long unitId,
        String unitName,
        BigDecimal quantity,
        BigDecimal conversionRate,
        BigDecimal baseQuantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        Long productPriceId,
        String pricingRuleName
) {
}
