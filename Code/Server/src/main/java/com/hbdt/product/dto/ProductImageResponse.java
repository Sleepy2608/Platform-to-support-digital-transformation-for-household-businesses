package com.hbdt.product.dto;

import java.time.LocalDateTime;

public record ProductImageResponse(
        Long id,
        Long productId,
        String imageUrl,
        boolean isPrimary,
        LocalDateTime createdAt
) {
}
