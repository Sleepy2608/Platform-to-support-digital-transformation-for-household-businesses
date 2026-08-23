package com.hbdt.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelOrderRequest(
        @NotBlank(message = "Lý do hủy đơn không được để trống")
        @Size(max = 500, message = "Lý do hủy đơn không được vượt quá 500 ký tự")
        String reason
) {
}
