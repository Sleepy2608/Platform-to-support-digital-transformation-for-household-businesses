package com.hbdt.config;

import com.hbdt.entity.Role;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.RoleRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedRoles();
        seedAdminUser();
    }

    private void seedRoles() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                Role role = Role.builder()
                        .name(roleType)
                        .description(getRoleDescription(roleType))
                        .build();
                roleRepository.save(role);
                logger.info("Seeded role: {}", roleType.name());
            }
        }
    }

    private String getRoleDescription(RoleType roleType) {
        return switch (roleType) {
            case ADMIN -> "Quản trị viên hệ thống";
            case BUSINESS_OWNER -> "Chủ hộ kinh doanh";
            case EMPLOYEE -> "Nhân viên cửa hàng";
        };
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Role ADMIN not found"));
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);

            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@hbdt.com")
                    .fullName("System Administrator")
                    .phone("0123456789")
                    .status(UserStatus.ACTIVE)
                    .roles(roles)
                    .build();

            userRepository.save(admin);
            logger.info("Seeded default admin user: admin / admin123");
        }
    }
}
