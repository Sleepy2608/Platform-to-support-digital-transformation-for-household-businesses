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
        migrateDatabaseRoles(); // Migrate old role names to new ones
        if (rolesEnabled) {
            seedRoles();
        }
        seedAdmin(); // Always ensure ADMIN account exists
        if (demoUsersEnabled) {
            seedOwnerUser();
        }
    }

    private void migrateDatabaseRoles() {
        try {
            Long headAdminId = queryForLong("SELECT id FROM roles WHERE role_code = 'HEAD_ADMIN'");
            
            if (headAdminId != null) {
                logger.info("Found HEAD_ADMIN role. Starting migration...");
                
                // 1. Move old ADMIN users to MANAGER
                Long oldAdminId = queryForLong("SELECT id FROM roles WHERE role_code = 'ADMIN'");
                Long managerId = queryForLong("SELECT id FROM roles WHERE role_code = 'MANAGER'");
                
                if (oldAdminId != null) {
                    if (managerId != null) {
                        // MANAGER already exists. Move users from old ADMIN to MANAGER.
                        jdbcTemplate.update("UPDATE users SET role_id = ? WHERE role_id = ?", managerId, oldAdminId);
                        // Delete old ADMIN role to free up the 'ADMIN' role_code
                        jdbcTemplate.update("DELETE FROM roles WHERE id = ?", oldAdminId);
                        logger.info("Migrated users from old ADMIN to existing MANAGER, deleted old ADMIN role.");
                    } else {
                        // Rename old ADMIN to MANAGER
                        jdbcTemplate.update("UPDATE roles SET role_code = 'MANAGER', role_name = 'Quản lý / Chuyên viên' WHERE id = ?", oldAdminId);
                        logger.info("Renamed old ADMIN role to MANAGER.");
                    }
                }
                
                // 2. Rename HEAD_ADMIN to ADMIN
                Long checkAdminId = queryForLong("SELECT id FROM roles WHERE role_code = 'ADMIN'");
                if (checkAdminId != null) {
                    // Somehow ADMIN exists again? Move users and delete HEAD_ADMIN
                    jdbcTemplate.update("UPDATE users SET role_id = ? WHERE role_id = ?", checkAdminId, headAdminId);
                    jdbcTemplate.update("DELETE FROM roles WHERE id = ?", headAdminId);
                    logger.info("Migrated users from HEAD_ADMIN to existing ADMIN, deleted HEAD_ADMIN role.");
                } else {
                    // Normal case: rename HEAD_ADMIN to ADMIN
                    jdbcTemplate.update("UPDATE roles SET role_code = 'ADMIN', role_name = 'Quản trị viên hệ thống' WHERE id = ?", headAdminId);
                    logger.info("Renamed HEAD_ADMIN role to ADMIN.");
                }
                
                logger.info("Successfully completed role migration.");
            }
        } catch (Exception e) {
            logger.error("Error migrating roles: ", e);
        }
    }

    private Long queryForLong(String sql) {
        try {
            return jdbcTemplate.queryForObject(sql, Long.class);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return null;
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
            case ADMIN -> "Quản trị viên hệ thống";
            case MANAGER -> "Quản lý / Chuyên viên";
            case BUSINESS_OWNER -> "Chủ hộ kinh doanh";
            case EMPLOYEE -> "Nhân viên";
        };
    }

    private String getRoleDescription(RoleType roleType) {
        return switch (roleType) {
            case ADMIN -> "Quản trị viên hệ thống cấp cao – toàn quyền";
            case MANAGER -> "Quản trị viên thường / Chuyên viên – không toàn quyền";
            case BUSINESS_OWNER -> "Chủ hộ kinh doanh";
            case EMPLOYEE -> "Nhân viên cửa hàng";
        };
    }

    /**
     * Đảm bảo tài khoản ADMIN mặc định (admin/admin) luôn tồn tại.
     * Nếu tài khoản đang có role MANAGER, nâng cấp lên ADMIN.
     */
    private void seedAdmin() {
        Role adminRole = roleRepository.findFirstByName(RoleType.ADMIN)
                .orElse(null);
        if (adminRole == null) {
            // Vai trò ADMIN chưa được seed – bỏ qua, seedRoles() sẽ tạo
            return;
        }

        userRepository.findByUsername("admin").ifPresentOrElse(existing -> {
            // Nếu tài khoản tồn tại nhưng chưa phải ADMIN, nâng cấp
            if (existing.getRole() == null || existing.getRole().getName() != RoleType.ADMIN) {
                existing.setRole(adminRole);
                userRepository.save(existing);
                logger.info("Upgraded 'admin' account to ADMIN");
            }
        }, () -> {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin"))
                    .email("admin@hbdt.com")
                    .fullName("Administrator")
                    .phone("0000000000")
                    .status(UserStatus.ACTIVE)
                    .role(adminRole)
                    .build();
            userRepository.save(admin);
            logger.info("Seeded ADMIN account: admin / admin");
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
