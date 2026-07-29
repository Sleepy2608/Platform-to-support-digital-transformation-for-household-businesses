package com.hbdt.auth.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private UserStatus status;
    private LocalDateTime createdAt;
}
