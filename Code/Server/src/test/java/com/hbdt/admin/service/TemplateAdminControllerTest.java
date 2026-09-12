package com.hbdt.admin.service;

import com.hbdt.admin.controller.TemplateAdminController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.Annotation;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RBAC verification test: ensures the TemplateAdminController is
 * properly annotated with {@code @PreAuthorize("hasRole('ADMIN')")}
 * at the class level, guaranteeing only ADMIN users can access
 * the template management endpoints.
 *
 * <p>This approach avoids the complexity of a full {@code @WebMvcTest}
 * and directly verifies the security contract via reflection.</p>
 */
class TemplateAdminControllerTest {

    @Test
    @DisplayName("RBAC: TemplateAdminController must have class-level @PreAuthorize for ADMIN role")
    void controller_mustHaveAdminPreAuthorize() {
        Annotation preAuth = TemplateAdminController.class.getAnnotation(PreAuthorize.class);
        assertThat(preAuth)
                .as("TemplateAdminController must be annotated with @PreAuthorize")
                .isNotNull();

        PreAuthorize preAuthorize = (PreAuthorize) preAuth;
        assertThat(preAuthorize.value())
                .as("@PreAuthorize must restrict to ADMIN role")
                .contains("hasRole('ADMIN')");
    }

    @Test
    @DisplayName("RBAC: Controller RequestMapping must use /api/admin/ prefix (secured in SecurityConfig)")
    void controller_mustUseAdminApiPrefix() {
        var requestMapping = TemplateAdminController.class
                .getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);
        assertThat(requestMapping).isNotNull();
        assertThat(requestMapping.value())
                .as("Endpoint must be under /api/admin/ which is secured to ADMIN in SecurityConfig")
                .anyMatch(path -> path.startsWith("/api/admin/"));
    }
}
