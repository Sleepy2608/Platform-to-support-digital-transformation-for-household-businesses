package com.hbdt.inventory.dto;

import java.math.BigDecimal;

/**
 * Response cho từng dòng sản phẩm trong phiếu nhập kho.
 */
public record StockImportItemResponse(
        Long id,
        Long productId,
        String productName,
        String productCode,
        Long unitId,
        String unitName,
        BigDecimal quantity,
        BigDecimal conversionRate,
        BigDecimal baseQuantity,
        BigDecimal purchasePrice,
        BigDecimal lineTotal
) {}
