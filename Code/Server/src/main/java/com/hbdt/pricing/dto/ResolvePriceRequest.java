package com.hbdt.pricing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ResolvePriceRequest(
        @NotNull(message = "Sản phẩm không được để trống") Long productId,
        @NotNull(message = "Đơn vị tính không được để trống") Long unitId,
        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn 0")
        @Digits(integer = 15, fraction = 3, message = "Số lượng không hợp lệ")
        BigDecimal quantity
) {
}
