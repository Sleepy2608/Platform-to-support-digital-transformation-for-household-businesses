package com.hbdt.employee.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.employee.dto.EmployeeProfileResponse;
import com.hbdt.employee.dto.EmployeeProfileUpdateRequest;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.UserStatus;
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
import java.util.Set;
import java.util.UUID;

/**
 * Service quản lý hồ sơ nhân viên (do chính Employee thực hiện).
 * Employee tự sửa: avatar, phone, email.
 */
@Service
@Transactional
public class EmployeeProfileService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeProfileService.class);

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    public EmployeeProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================
    // Xem hồ sơ
    // =========================================================

    @Transactional(readOnly = true)
    public EmployeeProfileResponse getProfile(String username) {
        User user = findEmployee(username);
        return toResponse(user);
    }

    // =========================================================
    // Cập nhật hồ sơ (email, phone)
    // =========================================================

    public EmployeeProfileResponse updateProfile(String username, EmployeeProfileUpdateRequest request) {
        User user = findEmployee(username);

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!request.getEmail().equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (!request.getPhone().equals(user.getPhone())
                    && userRepository.existsByPhone(request.getPhone())) {
                throw new BadRequestException("Số điện thoại này đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }

        User saved = userRepository.save(user);
        logger.info("Employee {} updated own profile", username);
        return toResponse(saved);
    }

    // =========================================================
    // Upload avatar
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

        String originalFilename = file.getOriginalFilename();
        String ext = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }

        String fileName = UUID.randomUUID() + ext;
        Path avatarDir = Paths.get(uploadDir, "avatars");
        Files.createDirectories(avatarDir);
        Path targetPath = avatarDir.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        String avatarUrl = "http://localhost:" + serverPort + "/uploads/avatars/" + fileName;

        User user = findEmployee(username);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        logger.info("Avatar uploaded for employee={}: {}", username, avatarUrl);
        return avatarUrl;
    }

    // =========================================================
    // Đổi mật khẩu
    // =========================================================

    public void changePassword(String username, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User user = findEmployee(username);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logger.info("Password changed for employee={}", username);
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findEmployee(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hóa");
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
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .businessId(user.getBusinessId())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .address(user.getAddress())
                .nationalId(user.getNationalId())
                .joinDate(user.getJoinDate())
                .position(user.getPosition())
                .terminationDate(user.getTerminationDate())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
