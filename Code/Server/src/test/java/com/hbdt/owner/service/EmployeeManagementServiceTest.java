package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.entitlement.service.FeatureEntitlementService;
import com.hbdt.owner.dto.CreateEmployeeRequest;
import com.hbdt.owner.dto.EmployeeResponse;
import com.hbdt.owner.dto.ResetPasswordResponse;
import com.hbdt.owner.dto.UpdateEmployeeRequest;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmployeeManagementServiceTest {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private PasswordEncoder passwordEncoder;
    private ImageStorageService imageStorageService;
    private FeatureEntitlementService featureEntitlementService;
    private EmployeeManagementService employeeService;

    private User owner;
    private Role employeeRole;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        roleRepository = mock(RoleRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        imageStorageService = mock(ImageStorageService.class);
        featureEntitlementService = mock(FeatureEntitlementService.class);

        employeeService = new EmployeeManagementService(
                userRepository,
                roleRepository,
                passwordEncoder,
                imageStorageService,
                featureEntitlementService
        );

        owner = User.builder()
                .id(1L)
                .username("owner1")
                .businessId(10L)
                .status(UserStatus.ACTIVE)
                .build();

        employeeRole = Role.builder()
                .id(3L)
                .name(RoleType.EMPLOYEE)
                .build();
    }

    @Test
    void createEmployee_Success_CreatesActiveEmployee() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));
        when(userRepository.countByBusinessIdAndRole_Name(10L, RoleType.EMPLOYEE)).thenReturn(2L);
        when(userRepository.existsByUsername("emp_test")).thenReturn(false);
        when(userRepository.existsByEmail("emp@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("0987654321")).thenReturn(false);
        when(roleRepository.findFirstByName(RoleType.EMPLOYEE)).thenReturn(Optional.of(employeeRole));
        when(passwordEncoder.encode("Pass@12345")).thenReturn("encoded_pass");

        CreateEmployeeRequest request = new CreateEmployeeRequest(
                "emp_test",
                "Pass@12345",
                "Nguyễn Nhân Viên",
                "emp@example.com",
                "0987654321",
                "Thu ngân",
                LocalDate.now()
        );

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });

        EmployeeResponse response = employeeService.createEmployee("owner1", request);

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals("emp_test", response.getUsername());
        assertEquals(UserStatus.ACTIVE, response.getStatus());
        assertEquals("Thu ngân", response.getPosition());

        verify(featureEntitlementService).validateFeatureQuota(10L, "EMPLOYEE_MANAGEMENT", 2L, "nhân viên");
    }

    @Test
    void createEmployee_MissingBusinessId_ThrowsBadRequestException() {
        owner.setBusinessId(null);
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));

        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setUsername("emp");

        assertThrows(BadRequestException.class, () -> employeeService.createEmployee("owner1", request));
        verifyNoInteractions(featureEntitlementService);
    }

    @Test
    void createEmployee_DuplicateUsername_ThrowsBadRequestException() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));
        when(userRepository.countByBusinessIdAndRole_Name(10L, RoleType.EMPLOYEE)).thenReturn(0L);
        when(userRepository.existsByUsername("duplicate_user")).thenReturn(true);

        CreateEmployeeRequest request = new CreateEmployeeRequest();
        request.setUsername("duplicate_user");

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> employeeService.createEmployee("owner1", request));
        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }

    @Test
    void lockAndUnlockEmployee_TogglesStatusCorrectly() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));

        User employee = User.builder()
                .id(20L)
                .username("staff1")
                .businessId(10L)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByIdAndBusinessIdAndRole_Name(20L, 10L, RoleType.EMPLOYEE))
                .thenReturn(Optional.of(employee));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Khóa
        EmployeeResponse locked = employeeService.lockEmployee("owner1", 20L);
        assertEquals(UserStatus.LOCKED, locked.getStatus());

        // Khóa lại -> lỗi
        assertThrows(BadRequestException.class, () -> employeeService.lockEmployee("owner1", 20L));

        // Mở khóa
        EmployeeResponse unlocked = employeeService.unlockEmployee("owner1", 20L);
        assertEquals(UserStatus.ACTIVE, unlocked.getStatus());

        // Mở khóa lại -> lỗi
        assertThrows(BadRequestException.class, () -> employeeService.unlockEmployee("owner1", 20L));
    }

    @Test
    void resetEmployeePassword_GeneratesTemporaryPassword() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));

        User employee = User.builder()
                .id(30L)
                .username("staff2")
                .businessId(10L)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByIdAndBusinessIdAndRole_Name(30L, 10L, RoleType.EMPLOYEE))
                .thenReturn(Optional.of(employee));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_temp_pw");

        ResetPasswordResponse resp = employeeService.resetEmployeePassword("owner1", 30L);

        assertNotNull(resp);
        assertEquals("staff2", resp.getUsername());
        assertNotNull(resp.getTemporaryPassword());
        assertEquals(10, resp.getTemporaryPassword().length());

        verify(userRepository).save(employee);
        assertEquals("hashed_temp_pw", employee.getPassword());
    }

    @Test
    void deleteEmployee_SoftDeletesBySettingDeactivated() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(owner));

        User employee = User.builder()
                .id(40L)
                .username("staff3")
                .businessId(10L)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByIdAndBusinessIdAndRole_Name(40L, 10L, RoleType.EMPLOYEE))
                .thenReturn(Optional.of(employee));

        employeeService.deleteEmployee("owner1", 40L);

        assertEquals(UserStatus.DEACTIVATED, employee.getStatus());
        verify(userRepository).save(employee);
    }
}
