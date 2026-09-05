package com.hbdt.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO cho API cập nhật khách hàng (HBDT-47).
 * Tất cả trường đều optional (partial update).
 */
public record CustomerUpdateRequest(

        @Size(min = 1, max = 150, message = "Tên khách hàng phải từ 1 đến 150 ký tự")
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
