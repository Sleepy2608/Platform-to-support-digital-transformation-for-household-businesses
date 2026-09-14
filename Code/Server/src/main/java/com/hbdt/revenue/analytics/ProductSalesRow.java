package com.hbdt.revenue.analytics;

import java.math.BigDecimal;

public record ProductSalesRow(Long productId, String productCode, String productName,
        String unitName, String status, BigDecimal quantitySold, long orderCount) {}
