package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.service.RateLimitService;
import com.hbdt.owner.dto.*;
import com.hbdt.owner.service.OwnerService;
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
 * REST controller for Owner Account Management.
 * All endpoints require BUSINESS_OWNER role.
 */
@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('BUSINESS_OWNER')")
public class OwnerController {

    private final OwnerService ownerService;
    private final RateLimitService rateLimitService;

    public OwnerController(OwnerService ownerService, RateLimitService rateLimitService) {
        this.ownerService = ownerService;
        this.rateLimitService = rateLimitService;
    }

    // =========================================================
    // Profile
    // =========================================================

    /**
     * GET /api/owner/profile
     * Get the authenticated owner's profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        OwnerProfileResponse profile = ownerService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", profile));
    }

    /**
     * PUT /api/owner/profile
     * Update the authenticated owner's display name.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        OwnerProfileResponse profile = ownerService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", profile));
    }

    // =========================================================
    // Avatar
    // =========================================================

    /**
     * POST /api/owner/avatar
     * Upload a new avatar image (multipart/form-data, field: "file").
     * Max 2MB, JPEG/PNG/WEBP/GIF only.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
        String avatarUrl = ownerService.uploadAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", avatarUrl));
    }

    // =========================================================
    // Password
    // =========================================================

    /**
     * PUT /api/owner/password
     * Change current password.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        ownerService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    // =========================================================
    // Change Email (OTP flow)
    // =========================================================

    /**
     * POST /api/owner/email/initiate
     * Send OTP to new email address. Rate-limited.
     */
    @PostMapping("/email/initiate")
    public ResponseEntity<ApiResponse<Void>> initiateEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangeEmailRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkOtpLimit(resolveClientIp(httpRequest));
        ownerService.initiateEmailChange(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Mã OTP đã được gửi đến email mới. Vui lòng kiểm tra hộp thư.", null));
    }

    /**
     * POST /api/owner/email/confirm?newEmail=xxx
     * Confirm email change with the OTP.
     */
    @PostMapping("/email/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("newEmail") String newEmail,
            @Valid @RequestBody VerifyOtpRequest request) {
        ownerService.confirmEmailChange(userDetails.getUsername(), newEmail, request);
        return ResponseEntity.ok(ApiResponse.success("Email đã được cập nhật thành công", null));
    }

    // =========================================================
    // Change Phone (OTP flow)
    // =========================================================

    /**
     * POST /api/owner/phone/initiate
     * Send OTP to new phone number. Rate-limited.
     */
    @PostMapping("/phone/initiate")
    public ResponseEntity<ApiResponse<Void>> initiatePhoneChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePhoneRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkOtpLimit(resolveClientIp(httpRequest));
        ownerService.initiatePhoneChange(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(
                "Mã OTP đã được gửi. Vui lòng kiểm tra (hoặc xem console ở dev mode).", null));
    }

    /**
     * POST /api/owner/phone/confirm?newPhone=xxx
     * Confirm phone change with the OTP.
     */
    @PostMapping("/phone/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPhoneChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("newPhone") String newPhone,
            @Valid @RequestBody VerifyOtpRequest request) {
        ownerService.confirmPhoneChange(userDetails.getUsername(), newPhone, request);
        return ResponseEntity.ok(ApiResponse.success("Số điện thoại đã được cập nhật thành công", null));
    }

    // =========================================================
    // Account Status
    // =========================================================

    /**
     * POST /api/owner/account/lock
     * Lock own account (self-service).
     */
    @PostMapping("/account/lock")
    public ResponseEntity<ApiResponse<Void>> lockAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        ownerService.lockAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Tài khoản đã được khóa", null));
    }

    /**
     * POST /api/owner/account/unlock
     * Unlock own account.
     */
    @PostMapping("/account/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        ownerService.unlockAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Tài khoản đã được mở khóa", null));
    }

    /**
     * DELETE /api/owner/account
     * Soft-delete (deactivate) the account. Requires password confirmation.
     */
    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DeactivateAccountRequest request) {
        ownerService.deactivateAccount(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Tài khoản đã được hủy kích hoạt thành công", null));
    }

    // =========================================================
    // Subscription
    // =========================================================

    /**
     * POST /api/owner/subscription/renew?months=N
     * Extend subscription by N months (1-24).
     */
    @PostMapping("/subscription/renew")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> renewSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") int months) {
        OwnerProfileResponse profile = ownerService.renewSubscription(userDetails.getUsername(), months);
        return ResponseEntity.ok(ApiResponse.success(
                "Gia hạn gói thành công đến " + profile.getSubscriptionExpiresAt(), profile));
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
