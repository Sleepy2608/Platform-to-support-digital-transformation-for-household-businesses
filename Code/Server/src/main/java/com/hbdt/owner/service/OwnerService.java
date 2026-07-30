package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.OtpService;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.OtpType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.*;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class OwnerService {

    private static final Logger logger = LoggerFactory.getLogger(OwnerService.class);

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    public OwnerService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
    }

    // =========================================================
    // Profile
    // =========================================================

    @Transactional(readOnly = true)
    public OwnerProfileResponse getProfile(String username) {
        User user = findActiveUser(username);
        return toProfileResponse(user);
    }

    public OwnerProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = findActiveUser(username);
        user.setFullName(request.getFullName());
        return toProfileResponse(userRepository.save(user));
    }

    // =========================================================
    // Avatar Upload
    // =========================================================

    public String uploadAvatar(String username, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BadRequestException("Kích thước file vượt quá 2MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new BadRequestException("Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF");
        }

        // Determine extension
        String originalFilename = file.getOriginalFilename();
        String ext = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }

        // Save file
        String fileName = UUID.randomUUID() + ext;
        Path avatarDir = Paths.get(uploadDir, "avatars");
        Files.createDirectories(avatarDir);
        Path targetPath = avatarDir.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Build accessible URL
        String avatarUrl = "http://localhost:" + serverPort + "/uploads/avatars/" + fileName;

        User user = findActiveUser(username);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        logger.info("Avatar uploaded for user={}: {}", username, avatarUrl);
        return avatarUrl;
    }

    // =========================================================
    // Password
    // =========================================================

    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Password changed for user={}", username);
    }

    // =========================================================
    // Change Email (OTP flow)
    // =========================================================

    public void initiateEmailChange(String username, ChangeEmailRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByEmail(request.getNewEmail())) {
            throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
        }

        // Store pending email in a temp mechanism — we use OTP target as the new email
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_EMAIL, request.getNewEmail());
        logger.info("Email change OTP sent for user={} -> {}", username, request.getNewEmail());
    }

    public void confirmEmailChange(String username, String newEmail, VerifyOtpRequest request) {
        User user = findActiveUser(username);

        // Verify OTP sent to newEmail
        otpService.verify(newEmail, OtpType.CHANGE_EMAIL, request.getOtp());

        user.setEmail(newEmail);
        userRepository.save(user);
        logger.info("Email changed for user={} to {}", username, newEmail);
    }

    // =========================================================
    // Change Phone (OTP flow — dev: logs to console)
    // =========================================================

    public void initiatePhoneChange(String username, ChangePhoneRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw new BadRequestException("Số điện thoại này đã được sử dụng");
        }

        // In dev-mode, OTP is logged by MailService. Target = phone number.
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_PHONE, request.getNewPhone());
        logger.info("Phone change OTP sent for user={} -> {}", username, request.getNewPhone());
    }

    public void confirmPhoneChange(String username, String newPhone, VerifyOtpRequest request) {
        User user = findActiveUser(username);

        otpService.verify(newPhone, OtpType.CHANGE_PHONE, request.getOtp());

        user.setPhone(newPhone);
        userRepository.save(user);
        logger.info("Phone changed for user={} to {}", username, newPhone);
    }

    // =========================================================
    // Account Status Management
    // =========================================================

    public void lockAccount(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản đã bị khóa");
        }
        user.setStatus(UserStatus.LOCKED);
        userRepository.save(user);
        logger.info("Account locked: {}", username);
    }

    public void unlockAccount(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản không ở trạng thái bị khóa");
        }
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        logger.info("Account unlocked: {}", username);
    }

    public void deactivateAccount(String username, DeactivateAccountRequest request) {
        User user = findActiveUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu không đúng. Không thể hủy tài khoản.");
        }

        user.setStatus(UserStatus.DEACTIVATED);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
        logger.info("Account deactivated (soft-delete): {}", username);
    }

    // =========================================================
    // Subscription
    // =========================================================

    public OwnerProfileResponse renewSubscription(String username, int months) {
        if (months < 1 || months > 24) {
            throw new BadRequestException("Số tháng gia hạn phải từ 1-24");
        }
        User user = findActiveUser(username);

        LocalDateTime baseDate = (user.getSubscriptionExpiresAt() != null
                && user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now()))
                ? user.getSubscriptionExpiresAt()
                : LocalDateTime.now();

        user.setSubscriptionExpiresAt(baseDate.plusMonths(months));
        return toProfileResponse(userRepository.save(user));
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findActiveUser(String username) {
        User user = findUserByUsername(username);
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
    }

    private OwnerProfileResponse toProfileResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        return OwnerProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .businessId(user.getBusinessId())
                .subscriptionExpiresAt(user.getSubscriptionExpiresAt())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
