package com.hbdt.employee.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO cho hồ sơ nhân viên (HBDT-114).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserStatus status;

    // Employee-specific fields
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String nationalId;
    private LocalDate joinDate;
    private String position;
    private LocalDate terminationDate;

    private Long businessId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
