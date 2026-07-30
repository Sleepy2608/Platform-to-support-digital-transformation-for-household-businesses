package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 255, message = "Họ tên quá dài")
    private String fullName;
}
