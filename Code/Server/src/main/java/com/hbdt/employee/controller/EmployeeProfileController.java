package com.hbdt.employee.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.employee.dto.ChangePasswordRequest;
import com.hbdt.employee.dto.EmployeeProfileResponse;
import com.hbdt.employee.dto.EmployeeProfileUpdateRequest;
import com.hbdt.employee.service.EmployeeProfileService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * REST controller — Employee tự quản lý hồ sơ cá nhân (HBDT-114).
 * Employee tự sửa: avatar, phone, email.
 * Owner sửa: chức vụ, trạng thái, ngày nghỉ (qua /api/owner/employees).
 */
@RestController
@RequestMapping("/api/employee")
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;

    public EmployeeProfileController(EmployeeProfileService employeeProfileService) {
        this.employeeProfileService = employeeProfileService;
    }

    /**
     * GET /api/employee/profile
     * Xem hồ sơ của chính mình.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeProfileResponse profile = employeeProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", profile));
    }

    /**
     * PUT /api/employee/profile
     * Cập nhật hồ sơ (email, phone).
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmployeeProfileUpdateRequest request) {
        EmployeeProfileResponse profile = employeeProfileService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", profile));
    }

    /**
     * POST /api/employee/profile/avatar
     * Upload avatar mới (multipart/form-data, field: "file"). Tối đa 2MB.
     */
    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String avatarUrl = employeeProfileService.uploadAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", avatarUrl));
    }

    /**
     * PUT /api/employee/password
     * Đổi mật khẩu của chính mình.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        employeeProfileService.changePassword(
                userDetails.getUsername(),
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword());
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
