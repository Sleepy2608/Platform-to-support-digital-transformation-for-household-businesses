package com.hbdt.owner.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO chứa thông tin đầy đủ của một nhân viên.
 * Dùng cho cả Owner xem và Employee xem (qua EmployeeManagementController).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserStatus status;

    // Employee profile fields (HBDT-114)
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
