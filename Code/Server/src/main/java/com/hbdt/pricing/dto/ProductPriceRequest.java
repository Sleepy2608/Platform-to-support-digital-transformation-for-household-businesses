package com.hbdt.pricing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductPriceRequest(
        @NotNull(message = "Đơn vị tính của sản phẩm không được để trống")
        Long productUnitId,

        @NotNull(message = "Đơn giá không được để trống")
        @DecimalMin(value = "0.00", message = "Đơn giá không được âm")
        @Digits(integer = 16, fraction = 2, message = "Đơn giá không hợp lệ")
        BigDecimal salePrice,

        @Size(max = 150, message = "Tên giá bán không được vượt quá 150 ký tự")
        String ruleName
) {
}
