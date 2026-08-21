package com.hbdt.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrderItemRequest(
        @NotNull(message = "ID sản phẩm không được để trống")
        Long productId,

        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "0.001", message = "Số lượng mua phải lớn hơn 0")
        BigDecimal quantity,

        BigDecimal unitPrice
) {
}
