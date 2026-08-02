package com.hbdt.owner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangeEmailRequest {

    @NotBlank(message = "Email mới không được để trống")
    @Email(message = "Email không hợp lệ")
    private String newEmail;

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;
}
