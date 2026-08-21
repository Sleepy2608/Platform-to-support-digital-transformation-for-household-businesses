package com.hbdt.pricing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ResolvePriceRequest(
        @NotNull(message = "Sản phẩm không được để trống") Long productId,
        @NotNull(message = "Đơn vị tính không được để trống") Long unitId,
        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "1", message = "Số lượng phải lớn hơn hoặc bằng 1")
        @Digits(integer = 15, fraction = 0, message = "Số lượng phải là số nguyên")
        BigDecimal quantity
) {
}
