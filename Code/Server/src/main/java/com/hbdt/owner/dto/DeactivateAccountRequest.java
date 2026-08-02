package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeactivateAccountRequest {

    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;
}
