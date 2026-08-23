package com.hbdt.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record QuickCreateCustomerRequest(
        @NotBlank(message = "Tên khách hàng không được để trống")
        @Size(max = 150, message = "Tên khách hàng không được vượt quá 150 ký tự")
        String customerName,

        @Pattern(regexp = "^$|^[0-9+ .()-]{8,20}$", message = "Số điện thoại không hợp lệ")
        String phone
) {
}
