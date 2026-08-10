package com.hbdt.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "Mã sản phẩm không được để trống")
        @Size(max = 50, message = "Mã sản phẩm không được vượt quá 50 ký tự")
        String productCode,

        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
        String productName,

        Long categoryId,

        @NotNull(message = "Đơn vị tính cơ bản không được để trống")
        Long baseUnitId,

        Long defaultTaxActivityGroupId,

        @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
        String imageUrl,

        String description,

        @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
        String status
) {
}
