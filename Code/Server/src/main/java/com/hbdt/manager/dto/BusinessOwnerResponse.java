package com.hbdt.manager.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BusinessOwnerResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private UserStatus status;
    private Long businessId;
    private LocalDateTime createdAt;
}
