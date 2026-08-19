package com.hbdt.entitlement.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO cho Admin map/unmap/config feature vào package.
 */
public record MapFeatureRequest(
        @NotNull(message = "Plan ID không được để trống")
        Long planId,

        @NotNull(message = "Feature ID không được để trống")
        Long featureId,

        /** Bật/tắt feature trong package (mặc định: true). */
        Boolean enabled,

        /** Giới hạn quota (null = không giới hạn). */
        Integer quotaLimit
) {
}
