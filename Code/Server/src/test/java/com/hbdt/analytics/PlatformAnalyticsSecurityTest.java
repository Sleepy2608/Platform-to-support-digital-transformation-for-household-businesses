package com.hbdt.analytics;

import com.hbdt.analytics.controller.PlatformAnalyticsController;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlatformAnalyticsSecurityTest {

    @Test
    void platformAnalyticsControllerEnforcesAdminAndManagerRolesOnly() {
        PreAuthorize annotation = PlatformAnalyticsController.class.getAnnotation(PreAuthorize.class);
        assertNotNull(annotation, "PlatformAnalyticsController must be annotated with @PreAuthorize");
        
        String rule = annotation.value();
        assertTrue(rule.contains("ADMIN"), "Platform Analytics must allow ADMIN");
        assertTrue(rule.contains("MANAGER"), "Platform Analytics must allow MANAGER");
        assertFalse(rule.contains("BUSINESS_OWNER"), "Platform Analytics must forbid BUSINESS_OWNER");
        assertFalse(rule.contains("EMPLOYEE"), "Platform Analytics must forbid EMPLOYEE");
    }
}
