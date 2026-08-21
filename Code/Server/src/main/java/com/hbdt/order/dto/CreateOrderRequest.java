package com.hbdt.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @Size(max = 150, message = "Tên khách hàng không được vượt quá 150 ký tự")
        String customerName,

        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String note,

        @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
        @Valid
        List<OrderItemRequest> items
) {
}
