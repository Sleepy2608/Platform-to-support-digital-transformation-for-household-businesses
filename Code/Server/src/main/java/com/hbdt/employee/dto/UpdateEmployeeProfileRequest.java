package com.hbdt.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request DTO cho Employee tự cập nhật họ tên (HBDT-114).
 * Employee chỉ được tự sửa fullName qua endpoint này.
 * (phone/email sửa qua OTP flow riêng, avatar qua multipart)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeProfileRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ tên phải từ 2 đến 150 ký tự")
    private String fullName;
}
