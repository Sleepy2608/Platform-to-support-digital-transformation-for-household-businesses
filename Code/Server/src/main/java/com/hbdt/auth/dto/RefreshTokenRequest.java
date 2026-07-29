package com.hbdt.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
