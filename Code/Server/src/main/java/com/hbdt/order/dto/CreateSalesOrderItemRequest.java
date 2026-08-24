package com.hbdt.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateSalesOrderItemRequest(
        @NotNull(message = "Sản phẩm không được để trống") Long productId,
        @NotNull(message = "Đơn vị tính không được để trống") Long unitId,
        @NotNull(message = "Số lượng không được để trống")
        @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn hoặc bằng 0.001")
        @Digits(integer = 15, fraction = 3, message = "Số lượng chỉ được có tối đa 3 chữ số thập phân")
        BigDecimal quantity,
        Long taxActivityGroupId
) {
}
