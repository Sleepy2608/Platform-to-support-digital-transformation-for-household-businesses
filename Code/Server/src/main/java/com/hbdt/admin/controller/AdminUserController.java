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
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * GET /api/admin/accounts – Lấy danh sách Admin.
     * Cả ADMIN và MANAGER đều được xem (SecurityConfig đã cho phép /api/admin/**).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminResponse>>> getAllAdmins() {
        List<User> headAdmins = userRepository.findByRoleType(RoleType.ADMIN);
        List<User> regularAdmins = userRepository.findByRoleType(RoleType.MANAGER);
        
        List<User> allAdmins = new java.util.ArrayList<>();
        allAdmins.addAll(headAdmins);
        allAdmins.addAll(regularAdmins);

        List<AdminResponse> response = allAdmins.stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Admin thành công", response));
    }

    /**
     * POST /api/admin/accounts – Tạo Admin mới.
     * Chỉ ADMIN được phép.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
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

        Role adminRole = roleRepository.findFirstByName(RoleType.MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò MANAGER"));
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

    /**
     * PUT /api/admin/accounts/{id} – Cập nhật thông tin Admin.
     * Cả ADMIN và MANAGER đều được (SecurityConfig cho phép /api/admin/**).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminResponse>> updateAdmin(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateRequest request) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Admin với ID: " + id));

        // Chỉ cho phép sửa MANAGER thường, không cho sửa ADMIN qua endpoint này
        if (admin.getRole() != null && admin.getRole().getName() == RoleType.ADMIN) {
            throw new BadRequestException("Không thể sửa tài khoản Siêu quản trị viên qua endpoint này");
        }

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

    /**
     * DELETE /api/admin/accounts/{id} – Xóa Admin.
     * Chỉ ADMIN được phép.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAdmin(@PathVariable Long id) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Admin với ID: " + id));

        // Không cho phép xóa tài khoản ADMIN
        if (admin.getRole() != null && admin.getRole().getName() == RoleType.ADMIN) {
            throw new BadRequestException("Không thể xóa tài khoản Siêu quản trị viên");
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
