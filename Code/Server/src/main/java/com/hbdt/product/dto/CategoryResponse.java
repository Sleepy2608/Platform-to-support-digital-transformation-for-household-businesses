package com.hbdt.product.dto;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long id,
        String categoryCode,
        String categoryName,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
