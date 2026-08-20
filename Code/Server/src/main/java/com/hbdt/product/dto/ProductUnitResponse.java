package com.hbdt.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class ProductUnitResponse {
    // Trả thông tin từ BE sang FE để hiển thị
    private final Long id;
    private final Long productId;
    private final Long unitId;
    private final String unitName;
    private final String unitCode;
    private final BigDecimal conversionRate;
    private final Boolean baseUnit;
    private final String status;
}
