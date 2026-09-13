package com.hbdt.analytics.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.hbdt.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlatformUserDetailResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String roleName;
    private UserStatus status;
    private Long businessId;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
