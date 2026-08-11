package com.hbdt.employee.dto;

import com.hbdt.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phản hồi thông tin nhân viên (Owner xem / quản lý).
 */
@Getter
@Setter
@Builder
public class EmployeeResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private UserStatus status;
    private Long businessId;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String nationalId;
    private LocalDate joinDate;
    private String position;
    private LocalDate terminationDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
