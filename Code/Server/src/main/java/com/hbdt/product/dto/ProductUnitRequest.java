package com.hbdt.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ProductUnitRequest {
    //Tỷ lệ quy đổi hàng hóa dùng để thay đổi đơn vị tính toán
    @NotNull(message = "Không được để trống đơn vị quy đổi")
    Long unitId;
    @DecimalMin(value="0.0",inclusive = false)
    private BigDecimal conversionRate;
}
