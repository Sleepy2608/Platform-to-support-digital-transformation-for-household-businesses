package com.hbdt.auth.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
