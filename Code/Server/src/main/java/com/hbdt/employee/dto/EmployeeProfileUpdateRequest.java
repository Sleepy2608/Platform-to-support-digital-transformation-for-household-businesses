package com.hbdt.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request cập nhật hồ sơ nhân viên (do chính Employee thực hiện).
 * Employee được tự sửa: email, số điện thoại.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeProfileUpdateRequest {

    @Email(message = "Email không hợp lệ")
    private String email;

    @Size(max = 20, message = "Số điện thoại quá dài")
    private String phone;
}
