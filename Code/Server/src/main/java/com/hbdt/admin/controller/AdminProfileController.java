package com.hbdt.admin.controller;

import com.hbdt.auth.dto.AdminChangePasswordRequest;
import com.hbdt.auth.dto.AdminProfileResponse;
import com.hbdt.auth.dto.AdminProfileUpdateRequest;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.User;
import com.hbdt.repository.UserRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * REST controller for Admin self-service profile management.
 * Allows the authenticated admin to view and update their own profile.
 * Different from AdminUserController which manages OTHER admin accounts.
 */
@RestController
@RequestMapping("/api/admin/profile")
public class AdminProfileController {

    private static final Logger logger = LoggerFactory.getLogger(AdminProfileController.class);
    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${server.port:8080}")
    private String serverPort;

    public AdminProfileController(UserRepository userRepository,
                                  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * GET /api/admin/profile
     * Get the authenticated admin's own profile information.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = findAdmin(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", toResponse(admin)));
    }

    /**
     * PUT /api/admin/profile
     * Update the authenticated admin's fullName, email, phone.
     */
    @PutMapping
    public ResponseEntity<ApiResponse<AdminProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AdminProfileUpdateRequest request) {
        User admin = findAdmin(userDetails.getUsername());

        // Check email uniqueness (skip if same)
        if (!admin.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
        }

        // Check phone uniqueness (skip if same or blank)
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (admin.getPhone() == null || !admin.getPhone().equals(request.getPhone())) {
                if (userRepository.existsByPhone(request.getPhone())) {
                    throw new BadRequestException("Số điện thoại này đã được sử dụng bởi tài khoản khác");
                }
            }
        }

        admin.setFullName(request.getFullName());
        admin.setEmail(request.getEmail());
        admin.setPhone(request.getPhone());

        User saved = userRepository.save(admin);
        logger.info("Admin profile updated: {}", userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công", toResponse(saved)));
    }

    /**
     * PUT /api/admin/profile/password
     * Change the authenticated admin's password.
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AdminChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User admin = findAdmin(userDetails.getUsername());

        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(admin);
        logger.info("Admin password changed: {}", userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    /**
     * POST /api/admin/profile/avatar
     * Upload/update the authenticated admin's avatar image.
     * Max 2MB, JPEG/PNG/WEBP/GIF only.
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AdminProfileResponse>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) throws IOException {
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

        // Determine file extension
        String originalFilename = file.getOriginalFilename();
        String ext = ".jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }

        // Save file to disk
        String fileName = UUID.randomUUID() + ext;
        Path avatarDir = Paths.get(uploadDir, "avatars");
        Files.createDirectories(avatarDir);
        Path targetPath = avatarDir.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Build accessible URL
        String avatarUrl = "http://localhost:" + serverPort + "/uploads/avatars/" + fileName;

        User admin = findAdmin(userDetails.getUsername());
        admin.setAvatarUrl(avatarUrl);
        User saved = userRepository.save(admin);

        logger.info("Avatar uploaded for admin={}: {}", userDetails.getUsername(), avatarUrl);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", toResponse(saved)));
    }

    // ===== Private helpers =====

    private User findAdmin(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
    }

    private AdminProfileResponse toResponse(User user) {
        return AdminProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
