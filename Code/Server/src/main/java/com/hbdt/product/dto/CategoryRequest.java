package com.hbdt.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Mã danh mục không được để trống")
        @Size(max = 30, message = "Mã danh mục không được vượt quá 30 ký tự")
        String categoryCode,

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục không được vượt quá 150 ký tự")
        String categoryName,

        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,

        @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
        String status
) {
}
