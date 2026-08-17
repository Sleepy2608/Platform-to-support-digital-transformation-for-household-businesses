package com.hbdt.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Mã sản phẩm không được để trống")
        @Size(max = 50, message = "Mã sản phẩm không được vượt quá 50 ký tự")
        String productCode,

        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
        String productName,

        Long categoryId,

        Long baseUnitId,

        Long defaultTaxActivityGroupId,

        @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá không được âm")
        BigDecimal salePrice,

        @Size(max = 500, message = "Đường dẫn ảnh không được vượt quá 500 ký tự")
        String imageUrl,

        String description,

        @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
        String status,

        @DecimalMin(value = "0.0", inclusive = true, message = "Số lượng sản phẩm không được âm")
        BigDecimal quantityOnHand
) {
    public ProductRequest(
            String productCode,
            String productName,
            Long categoryId,
            Long baseUnitId,
            Long defaultTaxActivityGroupId,
            String imageUrl,
            String description,
            String status,
            BigDecimal quantityOnHand
    ) {
        this(productCode, productName, categoryId, baseUnitId, defaultTaxActivityGroupId, BigDecimal.ZERO, imageUrl, description, status, quantityOnHand);
    }
}
