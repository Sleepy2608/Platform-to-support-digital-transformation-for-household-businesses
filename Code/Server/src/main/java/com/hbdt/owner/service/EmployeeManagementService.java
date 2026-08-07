package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.*;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service cho Owner quản lý tài khoản nhân viên (HBDT-14 + HBDT-114).
 *
 * Quy tắc phân quyền:
 *  - Owner chỉ thao tác trên nhân viên thuộc cùng businessId.
 *  - Owner không thể thao tác trên tài khoản BUSINESS_OWNER hoặc ADMIN.
 */
@Service
@Transactional
public class EmployeeManagementService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeManagementService.class);

    /** Ký tự dùng để sinh mật khẩu tạm thời */
    private static final String PASSWORD_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    private static final int TEMP_PASSWORD_LENGTH = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Các status hợp lệ mà Owner được phép set cho nhân viên */
    private static final Set<UserStatus> OWNER_ALLOWED_STATUS =
            Set.of(UserStatus.ACTIVE, UserStatus.INACTIVE);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeManagementService(UserRepository userRepository,
                                     RoleRepository roleRepository,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================================================
    // Create Employee (HBDT-14)
    // =========================================================

    /**
     * Owner tạo tài khoản nhân viên mới trong cửa hàng của mình.
     * Nhân viên được tạo với status ACTIVE (không cần xác thực email).
     */
    public EmployeeResponse createEmployee(String ownerUsername, CreateEmployeeRequest request) {
        User owner = findOwner(ownerUsername);
        Long businessId = owner.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }

        // Validate uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập '" + request.getUsername() + "' đã được sử dụng");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email này đã được sử dụng bởi tài khoản khác");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại này đã được sử dụng bởi tài khoản khác");
        }

        Role employeeRole = roleRepository.findFirstByName(RoleType.EMPLOYEE)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vai trò EMPLOYEE"));

        User employee = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .status(UserStatus.ACTIVE)
                .role(employeeRole)
                .businessId(businessId)
                .position(request.getPosition())
                .joinDate(request.getJoinDate())
                .build();

        User saved = userRepository.save(employee);
        logger.info("Employee created: username={}, businessId={}, by owner={}",
                saved.getUsername(), businessId, ownerUsername);
        return toResponse(saved);
    }

    // =========================================================
    // List Employees (HBDT-14)
    // =========================================================

    /**
     * Owner lấy danh sách nhân viên có phân trang và tìm kiếm.
     */
    @Transactional(readOnly = true)
    public EmployeeListResponse listEmployees(String ownerUsername,
                                              String keyword,
                                              UserStatus status,
                                              int page,
                                              int size) {
        User owner = findOwner(ownerUsername);
        Long businessId = owner.getBusinessId();
        if (businessId == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<User> pageResult = userRepository.findEmployeesByBusiness(
                businessId, RoleType.EMPLOYEE,
                (keyword == null || keyword.isBlank()) ? null : keyword.trim(),
                status,
                pageable);

        List<EmployeeResponse> content = pageResult.getContent()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return EmployeeListResponse.builder()
                .content(content)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();
    }

    // =========================================================
    // Get Employee (HBDT-14)
    // =========================================================

    /**
     * Owner xem chi tiết một nhân viên.
     */
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(String ownerUsername, Long employeeId) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());
        return toResponse(employee);
    }

    // =========================================================
    // Update Employee (HBDT-14 + HBDT-114)
    // =========================================================

    /**
     * Owner cập nhật thông tin nhân viên: chức vụ, trạng thái, ngày nghỉ, ngày vào làm, họ tên.
     */
    public EmployeeResponse updateEmployee(String ownerUsername, Long employeeId,
                                           UpdateEmployeeRequest request) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());

        // Validate status nếu được cung cấp
        if (request.getStatus() != null
                && !OWNER_ALLOWED_STATUS.contains(request.getStatus())) {
            throw new BadRequestException(
                    "Owner chỉ được đặt trạng thái ACTIVE hoặc INACTIVE");
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            employee.setFullName(request.getFullName());
        }
        if (request.getPosition() != null) {
            employee.setPosition(request.getPosition());
        }
        if (request.getStatus() != null) {
            employee.setStatus(request.getStatus());
        }
        if (request.getJoinDate() != null) {
            employee.setJoinDate(request.getJoinDate());
        }
        if (request.getTerminationDate() != null) {
            employee.setTerminationDate(request.getTerminationDate());
        }

        User saved = userRepository.save(employee);
        logger.info("Employee updated: id={}, by owner={}", employeeId, ownerUsername);
        return toResponse(saved);
    }

    // =========================================================
    // Lock / Unlock Employee (HBDT-14)
    // =========================================================

    /**
     * Owner khóa tài khoản nhân viên.
     */
    public EmployeeResponse lockEmployee(String ownerUsername, Long employeeId) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());
        if (employee.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản nhân viên đã bị khóa rồi");
        }
        employee.setStatus(UserStatus.LOCKED);
        User saved = userRepository.save(employee);
        logger.info("Employee locked: id={}, by owner={}", employeeId, ownerUsername);
        return toResponse(saved);
    }

    /**
     * Owner mở khóa tài khoản nhân viên.
     */
    public EmployeeResponse unlockEmployee(String ownerUsername, Long employeeId) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());
        if (employee.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException("Tài khoản nhân viên chưa bị khóa");
        }
        employee.setStatus(UserStatus.ACTIVE);
        User saved = userRepository.save(employee);
        logger.info("Employee unlocked: id={}, by owner={}", employeeId, ownerUsername);
        return toResponse(saved);
    }

    // =========================================================
    // Reset Password (HBDT-14)
    // =========================================================

    /**
     * Owner reset mật khẩu nhân viên.
     * Sinh mật khẩu tạm ngẫu nhiên, trả về trong response để Owner thông báo.
     */
    public ResetPasswordResponse resetEmployeePassword(String ownerUsername, Long employeeId) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());

        String tempPassword = generateTemporaryPassword();
        employee.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(employee);

        logger.info("Password reset for employee: id={}, by owner={}", employeeId, ownerUsername);
        return ResetPasswordResponse.builder()
                .username(employee.getUsername())
                .temporaryPassword(tempPassword)
                .message("Mật khẩu đã được đặt lại. Hãy thông báo mật khẩu tạm thời cho nhân viên và yêu cầu đổi ngay khi đăng nhập.")
                .build();
    }

    // =========================================================
    // Delete Employee (soft delete) (HBDT-14)
    // =========================================================

    /**
     * Owner xóa nhân viên (soft delete — đặt status = DEACTIVATED).
     */
    public void deleteEmployee(String ownerUsername, Long employeeId) {
        User owner = findOwner(ownerUsername);
        User employee = findEmployeeInBusiness(employeeId, owner.getBusinessId());
        if (employee.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản nhân viên đã bị xóa rồi");
        }
        employee.setStatus(UserStatus.DEACTIVATED);
        userRepository.save(employee);
        logger.info("Employee deactivated (soft-delete): id={}, by owner={}", employeeId, ownerUsername);
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findOwner(String ownerUsername) {
        User user = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy tài khoản: " + ownerUsername));
        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Tài khoản đã bị hủy kích hoạt");
        }
        return user;
    }

    private User findEmployeeInBusiness(Long employeeId, Long businessId) {
        if (businessId == null) {
            throw new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh");
        }
        return userRepository
                .findByIdAndBusinessIdAndRole_Name(employeeId, businessId, RoleType.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy nhân viên với id=" + employeeId + " trong cửa hàng này"));
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    private EmployeeResponse toResponse(User user) {
        return EmployeeResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
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
