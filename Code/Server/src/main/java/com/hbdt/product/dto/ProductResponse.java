package com.hbdt.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
        Long id,
        String productCode,
        String productName,
        Long categoryId,
        String categoryName,
        Long baseUnitId,
        String baseUnitName,
        BigDecimal salePrice,
        Long defaultTaxActivityGroupId,
        String defaultTaxActivityGroupName,
        String imageUrl,
        List<ProductImageResponse> images,
        String description,
        String status,
        BigDecimal quantityOnHand,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public ProductResponse(
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
            List<ProductImageResponse> images,
            String description,
            String status,
            BigDecimal quantityOnHand,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this(id, productCode, productName, categoryId, categoryName, baseUnitId, baseUnitName, BigDecimal.ZERO,
                defaultTaxActivityGroupId, defaultTaxActivityGroupName, imageUrl, images, description, status,
                quantityOnHand, createdAt, updatedAt);
    }
}
