package com.hbdt.owner.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@Builder
public class OwnerProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserStatus status;
    private Long businessId;
    private LocalDateTime subscriptionExpiresAt;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
