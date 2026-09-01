package com.hbdt.entitlement.dto;

import java.time.LocalDateTime;

/**
 * Response DTO cho danh sách features (Admin portal).
 */
public record FeatureResponse(
        Long id,
        String featureCode,
        String featureName,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
