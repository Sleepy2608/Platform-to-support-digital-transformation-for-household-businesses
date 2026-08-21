package com.hbdt.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrderItemRequest(
        @NotNull(message = "ID sản phẩm không được để trống")
        Long productId,

        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "1", message = "Số lượng mua phải lớn hơn hoặc bằng 1")
        @Digits(integer = 15, fraction = 0, message = "Số lượng mua phải là số nguyên")
        BigDecimal quantity,

        BigDecimal unitPrice
) {
}
