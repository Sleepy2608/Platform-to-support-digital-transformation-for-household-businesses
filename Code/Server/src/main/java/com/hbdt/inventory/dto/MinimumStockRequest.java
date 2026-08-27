package com.hbdt.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MinimumStockRequest(
        @NotNull(message = "Ngưỡng tồn kho tối thiểu không được để trống")
        @DecimalMin(value = "0", inclusive = true, message = "Ngưỡng tồn kho tối thiểu không được âm")
        @Digits(integer = 15, fraction = 3, message = "Ngưỡng tồn kho không được vượt quá 15 chữ số và 3 số lẻ")
        BigDecimal minimumStock
) {
}
