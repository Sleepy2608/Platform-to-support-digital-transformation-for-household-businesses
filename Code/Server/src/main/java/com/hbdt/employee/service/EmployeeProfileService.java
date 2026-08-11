package com.hbdt.employee.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.common.service.OtpService;
import com.hbdt.employee.dto.EmployeeProfileResponse;
import com.hbdt.employee.dto.UpdateEmployeeProfileRequest;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.OtpType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.ChangeEmailRequest;
import com.hbdt.owner.dto.ChangePasswordRequest;
import com.hbdt.owner.dto.ChangePhoneRequest;
import com.hbdt.owner.dto.VerifyOtpRequest;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

/**
 * Service cho Employee tự quản lý hồ sơ cá nhân (HBDT-114).
 * Employee được phép sửa: fullName, avatar, phone (OTP), email (OTP), password.
 * Các trường chức vụ / trạng thái / ngày nghỉ do Owner quản lý.
 */
@Service
@Transactional
public class EmployeeProfileService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeProfileService.class);

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final ImageStorageService imageStorageService;

    public EmployeeProfileService(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   OtpService otpService,
                                   ImageStorageService imageStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.imageStorageService = imageStorageService;
    }

    // =========================================================
    // Profile
    // =========================================================

    @Transactional(readOnly = true)
    public EmployeeProfileResponse getProfile(String username) {
        User user = findActiveEmployee(username);
        return toResponse(user);
    }

    public EmployeeProfileResponse updateProfile(String username, UpdateEmployeeProfileRequest request) {
        User user = findActiveEmployee(username);
        user.setFullName(request.getFullName());
        return toResponse(userRepository.save(user));
    }

    // =========================================================
    // Avatar
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

        User user = findActiveEmployee(username);
        ImageStorageService.StoredImage storedImage = imageStorageService.store(
                file, "avatars/" + user.getId(), MAX_AVATAR_SIZE, ALLOWED_MIME);
        user.setAvatarObjectKey(storedImage.objectKey());
        user.setAvatarSha256(storedImage.sha256());
        user.setAvatarContentType(storedImage.contentType());
        user.setAvatarSize(storedImage.size());
        userRepository.save(user);

        logger.info("Avatar uploaded for employee={}, sha256={}", username, storedImage.sha256());
        return imageStorageService.toPublicUrl(storedImage.objectKey());
    }

    // =========================================================
    // Password
    // =========================================================

    public void changePassword(String username, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }
        User user = findActiveEmployee(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Password changed for employee={}", username);
    }

    // =========================================================
    // Change Email (OTP flow)
    // =========================================================

    public void initiateEmailChange(String username, ChangeEmailRequest request) {
        User user = findActiveEmployee(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByEmail(request.getNewEmail())) {
            throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
        }
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_EMAIL, request.getNewEmail());
        logger.info("Email change OTP sent for employee={} -> {}", username, request.getNewEmail());
    }

    public void confirmEmailChange(String username, String newEmail, VerifyOtpRequest request) {
        User user = findActiveEmployee(username);
        otpService.verify(newEmail, OtpType.CHANGE_EMAIL, request.getOtp());
        user.setEmail(newEmail);
        userRepository.save(user);
        logger.info("Email changed for employee={} to {}", username, newEmail);
    }

    // =========================================================
    // Change Phone (OTP flow)
    // =========================================================

    public void initiatePhoneChange(String username, ChangePhoneRequest request) {
        User user = findActiveEmployee(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }
        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw new BadRequestException("Số điện thoại này đã được sử dụng");
        }
        otpService.generateAndSend(user.getId(), OtpType.CHANGE_PHONE, request.getNewPhone());
        logger.info("Phone change OTP sent for employee={} -> {}", username, request.getNewPhone());
    }

    public void confirmPhoneChange(String username, String newPhone, VerifyOtpRequest request) {
        User user = findActiveEmployee(username);
        otpService.verify(newPhone, OtpType.CHANGE_PHONE, request.getOtp());
        user.setPhone(newPhone);
        userRepository.save(user);
        logger.info("Phone changed for employee={} to {}", username, newPhone);
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findActiveEmployee(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private EmployeeProfileResponse toResponse(User user) {
        return EmployeeProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(imageStorageService.toPublicUrl(user.getAvatarObjectKey()))
                .status(user.getStatus())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .address(user.getAddress())
                .nationalId(user.getNationalId())
                .joinDate(user.getJoinDate())
                .position(user.getPosition())
                .terminationDate(user.getTerminationDate())
                .businessId(user.getBusinessId())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
