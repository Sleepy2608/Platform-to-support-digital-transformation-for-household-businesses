package com.hbdt.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class UpdateProductUnitRequest {
    @NotNull(message = "Không được để trống đơn vị quy đổi")
    @DecimalMin(value = "0.0",inclusive = false)
    private BigDecimal conversation;
}
