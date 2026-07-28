package com.hbdt.config;

import com.hbdt.entity.Role;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final RoleRepository roleRepository;

    public DatabaseSeeder(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        seedRoles();
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
}
