package com.hbdt.config;

import com.hbdt.entity.Role;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
@Order(1)
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed.roles-enabled:true}")
    private boolean rolesEnabled;

    @Value("${app.seed.demo-users-enabled:false}")
    private boolean demoUsersEnabled;

    public DatabaseSeeder(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        dropOldRoleCheckConstraint();
        if (rolesEnabled) {
            seedRoles();
        }
        seedHeadAdmin(); // Always ensure HEAD_ADMIN account exists
        if (demoUsersEnabled) {
            seedOwnerUser();
        }
    }

    private void dropOldRoleCheckConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE roles DROP CHECK roles_chk_1");
            logger.info("Successfully dropped old check constraint 'roles_chk_1' on table 'roles'.");
        } catch (Exception e) {
            logger.debug("Constraint 'roles_chk_1' might not exist or already dropped.");
        }
    }

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findFirstByName(roleType).isEmpty()) {
                Role role = Role.builder()
                        .name(roleType)
                        .roleName(getRoleDisplayName(roleType))
                        .description(getRoleDescription(roleType))
                        .build();
                roleRepository.save(role);
                logger.info("Seeded role: {}", roleType.name());
            }
        }
    }

    private String getRoleDisplayName(RoleType roleType) {
        return switch (roleType) {
            case HEAD_ADMIN -> "Siêu quản trị viên";
            case ADMIN -> "Quản trị viên";
            case BUSINESS_OWNER -> "Chủ hộ kinh doanh";
            case EMPLOYEE -> "Nhân viên";
        };
    }

    private String getRoleDescription(RoleType roleType) {
        return switch (roleType) {
            case HEAD_ADMIN -> "Siêu quản trị viên hệ thống – toàn quyền seed/create/delete Admin";
            case ADMIN -> "Quản trị viên thường – không được seed hoặc tạo/xóa Admin";
            case BUSINESS_OWNER -> "Chủ hộ kinh doanh";
            case EMPLOYEE -> "Nhân viên cửa hàng";
        };
    }

    /**
     * Đảm bảo tài khoản HEAD_ADMIN mặc định (admin/admin) luôn tồn tại.
     * Nếu tài khoản đang có role ADMIN, nâng cấp lên HEAD_ADMIN.
     */
    private void seedHeadAdmin() {
        Role headAdminRole = roleRepository.findFirstByName(RoleType.HEAD_ADMIN)
                .orElse(null);
        if (headAdminRole == null) {
            // Vai trò HEAD_ADMIN chưa được seed – bỏ qua, seedRoles() sẽ tạo
            return;
        }

        userRepository.findByUsername("admin").ifPresentOrElse(existing -> {
            // Nếu tài khoản tồn tại nhưng chưa phải HEAD_ADMIN, nâng cấp
            if (existing.getRole() == null || existing.getRole().getName() != RoleType.HEAD_ADMIN) {
                existing.setRole(headAdminRole);
                userRepository.save(existing);
                logger.info("Upgraded 'admin' account to HEAD_ADMIN");
            }
        }, () -> {
            User headAdmin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin"))
                    .email("admin@hbdt.com")
                    .fullName("Head Administrator")
                    .phone("0000000000")
                    .status(UserStatus.ACTIVE)
                    .role(headAdminRole)
                    .build();
            userRepository.save(headAdmin);
            logger.info("Seeded HEAD_ADMIN account: admin / admin");
        });
    }

    private void seedOwnerUser() {
        if (!userRepository.existsByUsername("owner")) {
            Role ownerRole = roleRepository.findFirstByName(RoleType.BUSINESS_OWNER)
                    .orElseThrow(() -> new RuntimeException("Role BUSINESS_OWNER not found"));
            User owner = User.builder()
                    .username("owner")
                    .password(passwordEncoder.encode("owner123"))
                    .email("owner@hbdt.com")
                    .fullName("Chủ Hộ Kinh Doanh Mẫu")
                    .phone("0987654321")
                    .status(UserStatus.ACTIVE)
                    .subscriptionExpiresAt(java.time.LocalDateTime.now().plusMonths(12))
                    .role(ownerRole)
                    .build();

            userRepository.save(owner);
            logger.info("Seeded default owner user: owner / owner123");
        }
    }
}
