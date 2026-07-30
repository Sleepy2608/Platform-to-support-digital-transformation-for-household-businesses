package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePhoneRequest {

    @NotBlank(message = "Số điện thoại mới không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{8,10}$", message = "Số điện thoại không hợp lệ")
    private String newPhone;

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;
}
