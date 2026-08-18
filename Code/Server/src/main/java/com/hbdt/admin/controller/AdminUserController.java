package com.hbdt.admin.controller;

import com.hbdt.auth.dto.ManagerCreateRequest;
import com.hbdt.auth.dto.ManagerResponse;
import com.hbdt.auth.dto.ManagerUpdateRequest;
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

    /** GET /api/admin/accounts – ADMIN xem danh sách tài khoản MANAGER. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ManagerResponse>>> getAllManagers() {
        List<ManagerResponse> response = userRepository.findByRoleType(RoleType.MANAGER).stream()
                .map(this::mapToManagerResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Manager thành công", response));
    }

    /** POST /api/admin/accounts – ADMIN tạo tài khoản MANAGER mới. */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponse>> createManager(@Valid @RequestBody ManagerCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng");
        }

        Role managerRole = roleRepository.findFirstByName(RoleType.MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò MANAGER"));
        User manager = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(UserStatus.ACTIVE)
                .role(managerRole)
                .build();

        User savedManager = userRepository.save(manager);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm Manager mới thành công", mapToManagerResponse(savedManager)));
    }

    /** PUT /api/admin/accounts/{id} – ADMIN cập nhật tài khoản MANAGER. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ManagerResponse>> updateManager(
            @PathVariable Long id,
            @Valid @RequestBody ManagerUpdateRequest request) {
        User manager = findManager(id);

        // Check duplicate email
        if (!manager.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        // Check duplicate phone
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (manager.getPhone() == null || !manager.getPhone().equals(request.getPhone())) {
                if (userRepository.existsByPhone(request.getPhone())) {
                    throw new BadRequestException("Số điện thoại đã được sử dụng");
                }
            }
        }

        manager.setEmail(request.getEmail());
        manager.setFullName(request.getFullName());
        manager.setPhone(request.getPhone());
        manager.setStatus(request.getStatus());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Mật khẩu phải từ 6 ký tự trở lên");
            }
            manager.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedManager = userRepository.save(manager);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tài khoản Manager thành công", mapToManagerResponse(updatedManager)));
    }

    /** DELETE /api/admin/accounts/{id} – ADMIN xóa tài khoản MANAGER. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteManager(@PathVariable Long id) {
        User manager = findManager(id);
        userRepository.delete(manager);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản Manager thành công", null));
    }

    private User findManager(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Manager với ID: " + id));
        if (user.getRole() == null || user.getRole().getName() != RoleType.MANAGER) {
            throw new BadRequestException("Chỉ được phép thao tác trên tài khoản Manager");
        }
        return user;
    }

    private ManagerResponse mapToManagerResponse(User user) {
        return ManagerResponse.builder()
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
