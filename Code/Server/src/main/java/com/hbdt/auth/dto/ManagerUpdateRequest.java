package com.hbdt.auth.dto;

import com.hbdt.entity.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerUpdateRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String password; // Optional password update

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String phone;

    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}
