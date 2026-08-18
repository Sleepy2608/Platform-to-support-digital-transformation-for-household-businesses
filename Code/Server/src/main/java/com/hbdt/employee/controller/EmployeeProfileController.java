package com.hbdt.employee.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.service.RateLimitService;
import com.hbdt.employee.dto.EmployeeProfileResponse;
import com.hbdt.employee.dto.UpdateEmployeeProfileRequest;
import com.hbdt.employee.service.EmployeeProfileService;
import com.hbdt.owner.dto.ChangeEmailRequest;
import com.hbdt.owner.dto.ChangePasswordRequest;
import com.hbdt.owner.dto.ChangePhoneRequest;
import com.hbdt.owner.dto.VerifyOtpRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * REST controller cho Employee tự quản lý hồ sơ cá nhân (HBDT-114).
 * Tất cả endpoint yêu cầu role EMPLOYEE.
 */
@RestController
@RequestMapping("/api/employee")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeProfileController {

    private final EmployeeProfileService employeeProfileService;
    private final RateLimitService rateLimitService;

    public EmployeeProfileController(EmployeeProfileService employeeProfileService,
                                     RateLimitService rateLimitService) {
        this.employeeProfileService = employeeProfileService;
        this.rateLimitService = rateLimitService;
    }

    // =========================================================
    // Profile
    // =========================================================

    /**
     * GET /api/employee/profile
     * Xem hồ sơ cá nhân.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        EmployeeProfileResponse profile = employeeProfileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", profile));
    }

    /**
     * PUT /api/employee/profile
     * Cập nhật họ tên.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<EmployeeProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateEmployeeProfileRequest request) {
        EmployeeProfileResponse profile = employeeProfileService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", profile));
    }

    // =========================================================
    // Avatar
    // =========================================================

    /**
     * POST /api/employee/avatar
     * Upload ảnh đại diện. Max 2MB, JPG/PNG/WEBP/GIF.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String avatarUrl = employeeProfileService.uploadAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", avatarUrl));
    }

    // =========================================================
    // Password
    // =========================================================

    /**
     * PUT /api/employee/password
     * Đổi mật khẩu.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        employeeProfileService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    // =========================================================
    // Change Email (OTP flow)
    // =========================================================

    /**
     * POST /api/employee/email/initiate
     * Gửi OTP đến email mới. Rate-limited.
     */
    @PostMapping("/email/initiate")
    public ResponseEntity<ApiResponse<Void>> initiateEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangeEmailRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkOtpLimit(resolveClientIp(httpRequest));
        employeeProfileService.initiateEmailChange(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Mã OTP đã được gửi đến email mới. Vui lòng kiểm tra hộp thư.", null));
    }

    /**
     * POST /api/employee/email/confirm?newEmail=xxx
     * Xác nhận đổi email bằng OTP.
     */
    @PostMapping("/email/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("newEmail") String newEmail,
            @Valid @RequestBody VerifyOtpRequest request) {
        employeeProfileService.confirmEmailChange(userDetails.getUsername(), newEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Email đã được cập nhật thành công", null));
    }

    // =========================================================
    // Change Phone (OTP flow)
    // =========================================================

    /**
     * POST /api/employee/phone/initiate
     * Gửi OTP đến số điện thoại mới. Rate-limited.
     */
    @PostMapping("/phone/initiate")
    public ResponseEntity<ApiResponse<Void>> initiatePhoneChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePhoneRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkOtpLimit(resolveClientIp(httpRequest));
        employeeProfileService.initiatePhoneChange(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Mã OTP đã được gửi. Vui lòng kiểm tra (hoặc xem console ở dev mode).", null));
    }

    /**
     * POST /api/employee/phone/confirm?newPhone=xxx
     * Xác nhận đổi số điện thoại bằng OTP.
     */
    @PostMapping("/phone/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPhoneChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("newPhone") String newPhone,
            @Valid @RequestBody VerifyOtpRequest request) {
        employeeProfileService.confirmPhoneChange(userDetails.getUsername(), newPhone, request);
        return ResponseEntity.ok(ApiResponse.success("Số điện thoại đã được cập nhật thành công", null));
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private String resolveClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return (xfHeader != null && !xfHeader.isEmpty())
                ? xfHeader.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}
