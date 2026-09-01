package com.hbdt.entitlement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO cho Admin tạo/cập nhật feature.
 */
public record FeatureRequest(
        @NotBlank(message = "Mã tính năng không được để trống")
        @Size(max = 50, message = "Mã tính năng tối đa 50 ký tự")
        String featureCode,

        @NotBlank(message = "Tên tính năng không được để trống")
        @Size(max = 150, message = "Tên tính năng tối đa 150 ký tự")
        String featureName,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        String status
) {
}
