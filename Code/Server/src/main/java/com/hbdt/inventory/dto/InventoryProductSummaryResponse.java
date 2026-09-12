package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * Tổng hợp biến động kho của từng sản phẩm trong kỳ báo cáo.
 */
@Builder
public record InventoryProductSummaryResponse(
        Long productId,
        String productCode,
        String productName,
        String unitName,
        BigDecimal openingQuantity,
        BigDecimal openingAmount,
        BigDecimal importQuantity,
        BigDecimal importAmount,
        BigDecimal exportQuantity,
        BigDecimal exportAmount,
        BigDecimal closingQuantity,
        BigDecimal closingAmount
) {
}
