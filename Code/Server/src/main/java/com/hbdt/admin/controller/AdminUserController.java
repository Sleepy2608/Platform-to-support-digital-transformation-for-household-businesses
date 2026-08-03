package com.hbdt.admin.controller;

import com.hbdt.auth.dto.AdminCreateRequest;
import com.hbdt.auth.dto.AdminResponse;
import com.hbdt.auth.dto.AdminUpdateRequest;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/accounts")
public class AdminUserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserRepository userRepository,
                               RoleRepository roleRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminResponse>>> getAllAdmins() {
        List<User> admins = userRepository.findByRoleType(RoleType.ADMIN);
        List<AdminResponse> response = admins.stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Admin thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminResponse>> createAdmin(@Valid @RequestBody AdminCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng");
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò ADMIN"));
        User admin = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(UserStatus.ACTIVE)
                .role(adminRole)
                .build();

        User savedAdmin = userRepository.save(admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm Admin mới thành công", mapToAdminResponse(savedAdmin)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminResponse>> updateAdmin(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateRequest request) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Admin với ID: " + id));

        // Check duplicate email
        if (!admin.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        // Check duplicate phone
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (admin.getPhone() == null || !admin.getPhone().equals(request.getPhone())) {
                if (userRepository.existsByPhone(request.getPhone())) {
                    throw new BadRequestException("Số điện thoại đã được sử dụng");
                }
            }
        }

        admin.setEmail(request.getEmail());
        admin.setFullName(request.getFullName());
        admin.setPhone(request.getPhone());
        
        // Prevent disabling default 'admin' account
        if ("admin".equals(admin.getUsername()) && request.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Không thể thay đổi trạng thái hoạt động của Root Admin");
        }
        admin.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Mật khẩu phải từ 6 ký tự trở lên");
            }
            admin.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedAdmin = userRepository.save(admin);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tài khoản Admin thành công", mapToAdminResponse(updatedAdmin)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdmin(@PathVariable Long id) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Admin với ID: " + id));

        // Prevent deleting default 'admin' account
        if ("admin".equals(admin.getUsername())) {
            throw new BadRequestException("Không thể xóa tài khoản Admin hệ thống mặc định");
        }

        userRepository.delete(admin);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản Admin thành công", null));
    }

    private AdminResponse mapToAdminResponse(User user) {
        return AdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
