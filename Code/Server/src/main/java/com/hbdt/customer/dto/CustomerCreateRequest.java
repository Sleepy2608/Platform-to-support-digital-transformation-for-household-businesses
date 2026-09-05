package com.hbdt.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO cho API tạo mới khách hàng đầy đủ (HBDT-47).
 */
public record CustomerCreateRequest(

        @NotBlank(message = "Tên khách hàng không được để trống")
        @Size(max = 150, message = "Tên khách hàng không được vượt quá 150 ký tự")
        String customerName,

        @Pattern(regexp = "^$|^[0-9+ .()-]{8,20}$", message = "Số điện thoại không hợp lệ")
        String phone,

        @Email(message = "Email không hợp lệ")
        @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
        String email,

        @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
        String address,

        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String note
) {
}
