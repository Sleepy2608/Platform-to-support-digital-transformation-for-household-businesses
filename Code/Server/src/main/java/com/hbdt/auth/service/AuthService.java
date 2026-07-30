package com.hbdt.auth.service;

import com.hbdt.auth.dto.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.security.JwtTokenProvider;
import com.hbdt.common.service.OtpService;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.OtpType;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
    }

    /**
     * Register a new Business Owner account.
     * Sets status to PENDING_VERIFICATION and sends OTP to email.
     */
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng");
        }

        Role ownerRole = roleRepository.findByName(RoleType.BUSINESS_OWNER)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò BUSINESS_OWNER"));

        Set<Role> roles = new HashSet<>();
        roles.add(ownerRole);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(UserStatus.PENDING_VERIFICATION)
                .roles(roles)
                .build();

        userRepository.save(user);

        // Send verification OTP to registered email
        otpService.generateAndSend(user.getId(), OtpType.REGISTER, user.getEmail());
    }

    /**
     * Verify the registration OTP and activate the account.
     */
    public void verifyRegistrationOtp(VerifyOtpRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản"));

        if (user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Tài khoản đã được kích hoạt hoặc không ở trạng thái chờ xác thực");
        }

        // OTP was sent to user's email
        otpService.verify(user.getEmail(), OtpType.REGISTER, request.getOtp());

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    /**
     * Authenticate user and return JWT tokens.
     */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = (User) authentication.getPrincipal();

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt.");
        }
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Tài khoản chưa được xác thực. Vui lòng kiểm tra email.");
        }

        return buildAuthResponse(authentication, user);
    }

    /**
     * Refresh access token using a valid refresh token.
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng"));

        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản không còn hoạt động");
        }

        String newAccessToken = jwtTokenProvider.generateAccessTokenFromUsername(username);

        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .businessId(user.getBusinessId())
                .build();
    }

    /**
     * Send a forgot-password OTP to the user's registered email.
     */
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản với email này"));

        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }

        otpService.generateAndSend(user.getId(), OtpType.FORGOT_PASSWORD, user.getEmail());
    }

    /**
     * Reset password using OTP received via email.
     */
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản với email này"));

        // Verify OTP
        otpService.verify(user.getEmail(), OtpType.FORGOT_PASSWORD, request.getOtp());

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // Re-activate account if it was locked
        if (user.getStatus() == UserStatus.LOCKED) {
            user.setStatus(UserStatus.ACTIVE);
        }
        userRepository.save(user);
    }

    /**
     * Build authentication response with tokens.
     */
    private AuthResponse buildAuthResponse(Authentication authentication, User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .businessId(user.getBusinessId())
                .build();
    }
}
