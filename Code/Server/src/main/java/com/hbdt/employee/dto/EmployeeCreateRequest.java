package com.hbdt.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * Request tạo mới tài khoản nhân viên (do Owner thực hiện).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeCreateRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 100, message = "Tên đăng nhập phải từ 4-100 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên quá dài")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại quá dài")
    private String phone;

    @Size(max = 100, message = "Chức vụ quá dài")
    private String position;

    private LocalDate joinDate;

    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Giới tính không hợp lệ")
    private String gender;

    @Size(max = 20, message = "CCCD quá dài")
    private String nationalId;

    @Size(max = 500, message = "Địa chỉ quá dài")
    private String address;
}
