package com.hbdt.auth.controller;

import com.hbdt.auth.dto.*;
import com.hbdt.auth.service.AuthService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    public AuthController(AuthService authService, RateLimitService rateLimitService) {
        this.authService = authService;
        this.rateLimitService = rateLimitService;
    }

    /**
     * POST /api/auth/login
     * Authenticate user and return access + refresh tokens. Rate-limited.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkLoginLimit(resolveClientIp(httpRequest));
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    /**
     * POST /api/auth/register
     * Register a new Business Owner account (sends verification OTP to email).
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.", null));
    }

    /**
     * POST /api/auth/verify-otp
     * Verify the registration OTP to activate the account.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyRegistrationOtp(request);
        return ResponseEntity.ok(
                ApiResponse.success("Tài khoản đã được kích hoạt thành công. Bạn có thể đăng nhập.", null));
    }

    /**
     * POST /api/auth/refresh-token
     * Get a new access token using a refresh token.
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", response));
    }

    /**
     * POST /api/auth/forgot-password
     * Send OTP to registered email for password reset. Rate-limited.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.checkOtpLimit(resolveClientIp(httpRequest));
        authService.forgotPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.", null));
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using OTP received via email.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.", null));
    }

    /**
     * POST /api/auth/logout
     * Logout user (stateless JWT — client discards token).
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    // ===== Private helpers =====

    private String resolveClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return (xfHeader != null && !xfHeader.isEmpty())
                ? xfHeader.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}
