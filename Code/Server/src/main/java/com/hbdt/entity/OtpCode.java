package com.hbdt.entity;

import com.hbdt.entity.enums.OtpType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Ephemeral OTP value stored in memory by OtpService.
 * It is deliberately not a JPA entity because otp_codes is not part of the
 * approved database schema.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpCode {
    private Long userId;
    private String code;
    private OtpType type;
    private String target;
    private LocalDateTime expiresAt;
    private boolean used;
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
