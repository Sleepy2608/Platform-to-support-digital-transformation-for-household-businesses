package com.hbdt.employee.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.AuditLogService;
import com.hbdt.employee.dto.*;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý tài khoản nhân viên (do Owner thực hiện).
 * - Mọi thao tác được giới hạn trong phạm vi businessId của Owner đang đăng nhập.
 * - Mọi thao tác thay đổi đều được ghi audit log (SRS HBDT-03.4).
 */
@Service
@Transactional
public class EmployeeService {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeService.class);
    private static final String ENTITY_TYPE = "EMPLOYEE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public EmployeeService(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuditLogService auditLogService,
                           ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    // =========================================================
    // Danh sách & tìm kiếm
    // =========================================================

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees(Long businessId, String search) {
        List<User> employees;
        if (search != null && !search.isBlank()) {
            employees = userRepository.searchByBusinessIdAndRoleType(businessId, RoleType.EMPLOYEE, search.trim());
        } else {
            employees = userRepository.findByBusinessIdAndRoleType(businessId, RoleType.EMPLOYEE);
        }
        return employees.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long businessId, Long employeeId) {
        User employee = findEmployee(businessId, employeeId);
        return toResponse(employee);
    }

    // =========================================================
    // Tạo nhân viên
    // =========================================================

    public EmployeeResponse createEmployee(Long ownerId, Long businessId,
                                           EmployeeCreateRequest request, HttpServletRequest httpRequest) {
        if (businessId == null) {
            throw new BadRequestException("Tài khoản Owner chưa có hồ sơ hộ kinh doanh");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Số điện thoại đã được sử dụng");
        }

        Role employeeRole = roleRepository.findFirstByName(RoleType.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò EMPLOYEE"));

        User employee = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .position(request.getPosition())
                .joinDate(request.getJoinDate() != null ? request.getJoinDate() : LocalDate.now())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .nationalId(request.getNationalId())
                .address(request.getAddress())
                .status(UserStatus.ACTIVE)
                .businessId(businessId)
                .role(employeeRole)
                .build();

        User saved = userRepository.save(employee);
        logger.info("Owner {} created employee {} in business {}", ownerId, saved.getId(), businessId);

        auditLogService.log(businessId, ownerId, "CREATE_EMPLOYEE", ENTITY_TYPE,
                saved.getId(), null, toResponse(saved), httpRequest);

        return toResponse(saved);
    }

    // =========================================================
    // Cập nhật nhân viên (Owner sửa: họ tên, chức vụ, trạng thái, ngày nghỉ)
    // =========================================================

    public EmployeeResponse updateEmployee(Long ownerId, Long businessId, Long employeeId,
                                           EmployeeUpdateRequest request, HttpServletRequest httpRequest) {
        User employee = findEmployee(businessId, employeeId);
        if (employee.getId().equals(ownerId)) {
            throw new BadRequestException("Không thể thao tác trên tài khoản của chính mình");
        }

        Object oldData = toResponse(employee);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            employee.setFullName(request.getFullName());
        }
        if (request.getPosition() != null) {
            employee.setPosition(request.getPosition());
        }
        if (request.getTerminationDate() != null) {
            employee.setTerminationDate(request.getTerminationDate());
        }
        if (request.getStatus() != null) {
            validateStatusTransition(employee.getStatus(), request.getStatus());
            employee.setStatus(request.getStatus());
            if (request.getStatus() == UserStatus.DEACTIVATED) {
                employee.setTerminationDate(request.getTerminationDate() != null
                        ? request.getTerminationDate() : LocalDate.now());
            }
            if (request.getStatus() == UserStatus.ACTIVE && employee.getTerminationDate() != null) {
                employee.setTerminationDate(null);
            }
        }

        User saved = userRepository.save(employee);
        logger.info("Owner {} updated employee {} in business {}", ownerId, saved.getId(), businessId);

        auditLogService.log(businessId, ownerId, "UPDATE_EMPLOYEE", ENTITY_TYPE,
                saved.getId(), oldData, toResponse(saved), httpRequest);

        return toResponse(saved);
    }

    // =========================================================
    // Xóa nhân viên (soft-delete → DEACTIVATED)
    // =========================================================

    public void deleteEmployee(Long ownerId, Long businessId, Long employeeId, HttpServletRequest httpRequest) {
        User employee = findEmployee(businessId, employeeId);
        if (employee.getId().equals(ownerId)) {
            throw new BadRequestException("Không thể thao tác trên tài khoản của chính mình");
        }
        if (employee.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Nhân viên đã bị xóa trước đó");
        }

        Object oldData = toResponse(employee);
        employee.setStatus(UserStatus.DEACTIVATED);
        employee.setTerminationDate(LocalDate.now());
        userRepository.save(employee);
        logger.info("Owner {} deleted (soft) employee {} in business {}", ownerId, employeeId, businessId);

        auditLogService.log(businessId, ownerId, "DELETE_EMPLOYEE", ENTITY_TYPE,
                employeeId, oldData, toResponse(employee), httpRequest);
    }

    // =========================================================
    // Reset mật khẩu
    // =========================================================

    public void resetPassword(Long ownerId, Long businessId, Long employeeId,
                              ResetPasswordRequest request, HttpServletRequest httpRequest) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        User employee = findEmployee(businessId, employeeId);
        if (employee.getId().equals(ownerId)) {
            throw new BadRequestException("Không thể thao tác trên tài khoản của chính mình");
        }

        employee.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(employee);
        logger.info("Owner {} reset password for employee {} in business {}", ownerId, employeeId, businessId);

        auditLogService.log(businessId, ownerId, "RESET_EMPLOYEE_PASSWORD", ENTITY_TYPE,
                employeeId, null, null, httpRequest);
    }

    // =========================================================
    // Khóa / Mở khóa
    // =========================================================

    public void lockEmployee(Long ownerId, Long businessId, Long employeeId, HttpServletRequest httpRequest) {
        User employee = findEmployee(businessId, employeeId);
        if (employee.getId().equals(ownerId)) {
            throw new BadRequestException("Không thể thao tác trên tài khoản của chính mình");
        }
        if (employee.getStatus() == UserStatus.LOCKED) {
            throw new BadRequestException("Nhân viên đã bị khóa");
        }
        if (employee.getStatus() == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Nhân viên đã bị xóa, không thể khóa");
        }

        Object oldData = toResponse(employee);
        employee.setStatus(UserStatus.LOCKED);
        userRepository.save(employee);
        logger.info("Owner {} locked employee {} in business {}", ownerId, employeeId, businessId);

        auditLogService.log(businessId, ownerId, "LOCK_EMPLOYEE", ENTITY_TYPE,
                employeeId, oldData, toResponse(employee), httpRequest);
    }

    public void unlockEmployee(Long ownerId, Long businessId, Long employeeId, HttpServletRequest httpRequest) {
        User employee = findEmployee(businessId, employeeId);
        if (employee.getId().equals(ownerId)) {
            throw new BadRequestException("Không thể thao tác trên tài khoản của chính mình");
        }
        if (employee.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException("Nhân viên không ở trạng thái bị khóa");
        }

        Object oldData = toResponse(employee);
        employee.setStatus(UserStatus.ACTIVE);
        userRepository.save(employee);
        logger.info("Owner {} unlocked employee {} in business {}", ownerId, employeeId, businessId);

        auditLogService.log(businessId, ownerId, "UNLOCK_EMPLOYEE", ENTITY_TYPE,
                employeeId, oldData, toResponse(employee), httpRequest);
    }

    // =========================================================
    // Private helpers
    // =========================================================

    private User findEmployee(Long businessId, Long employeeId) {
        return userRepository.findByIdAndBusinessIdAndRoleType(employeeId, businessId, RoleType.EMPLOYEE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy nhân viên với ID: " + employeeId));
    }

    private void validateStatusTransition(UserStatus current, UserStatus target) {
        if (current == UserStatus.DEACTIVATED) {
            throw new BadRequestException("Nhân viên đã bị xóa, không thể thay đổi trạng thái");
        }
        if (target == UserStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Trạng thái PENDING_VERIFICATION không áp dụng cho nhân viên");
        }
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
