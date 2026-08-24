package com.hbdt.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductUnitRequest {
    @NotNull(message = "Đơn vị tính không được để trống")
    private Long unitId;

    @NotNull(message = "Tỷ lệ quy đổi không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Tỷ lệ quy đổi phải lớn hơn 0")
    private BigDecimal conversionRate;
}
