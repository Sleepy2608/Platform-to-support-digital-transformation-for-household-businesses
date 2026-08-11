package com.hbdt.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String productCode,
        String productName,
        Long categoryId,
        String categoryName,
        Long baseUnitId,
        String baseUnitName,
        Long defaultTaxActivityGroupId,
        String defaultTaxActivityGroupName,
        String imageUrl,
        String description,
        String status,
        BigDecimal quantityOnHand,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
