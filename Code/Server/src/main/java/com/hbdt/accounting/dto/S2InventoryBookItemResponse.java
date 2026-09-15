package com.hbdt.accounting.dto;

import java.math.BigDecimal;

public record S2InventoryBookItemResponse(Long productId, String productCode, String productName,
        String baseUnitName, BigDecimal openingQuantity, BigDecimal openingValue,
        BigDecimal stockInQuantity, BigDecimal stockInValue, BigDecimal returnedQuantity,
        BigDecimal returnedValue, BigDecimal stockOutQuantity, BigDecimal stockOutValue,
        BigDecimal closingQuantity, BigDecimal closingValue, BigDecimal averageUnitCost,
        boolean costComplete, String costWarning) {
}
