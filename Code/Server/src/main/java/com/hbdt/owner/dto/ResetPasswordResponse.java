package com.hbdt.owner.dto;

import lombok.*;

/**
 * Response DTO trả về mật khẩu tạm thời sau khi Owner reset (HBDT-14).
 * Owner sẽ thông báo mật khẩu này trực tiếp cho nhân viên.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResetPasswordResponse {

    private String username;
    private String temporaryPassword;
    private String message;
}
