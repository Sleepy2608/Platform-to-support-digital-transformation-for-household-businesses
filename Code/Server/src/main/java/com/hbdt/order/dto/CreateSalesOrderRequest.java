package com.hbdt.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateSalesOrderRequest(
        @NotBlank(message = "Mã đơn hàng không được để trống")
        @Size(max = 50, message = "Mã đơn hàng không được vượt quá 50 ký tự")
        String orderCode,
        Long customerId,
        @Pattern(regexp = "(?i)POS|ONLINE|MANUAL", message = "Nguồn đơn hàng không hợp lệ")
        String source,
        @DecimalMin(value = "0.00", message = "Số tiền đã trả không được âm")
        @Digits(integer = 16, fraction = 2, message = "Số tiền đã trả không hợp lệ")
        BigDecimal paidAmount,
        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String note,
        @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
        List<@Valid CreateSalesOrderItemRequest> items
) {
}
