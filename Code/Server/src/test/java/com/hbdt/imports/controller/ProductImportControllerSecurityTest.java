package com.hbdt.imports.controller;

import com.hbdt.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductImportControllerSecurityTest {

    @Test
    void importEndpointsAllowOwnersAndRejectAdminRoleDeclaration() throws Exception {
        assertOwnerOnly(ProductImportController.class.getMethod("downloadTemplate", String.class));
        assertOwnerOnly(ProductImportController.class.getMethod(
                "importProducts", MultipartFile.class, User.class));
        assertOwnerOnly(ProductImportController.class.getMethod("downloadErrorReport", List.class));
    }

    private void assertOwnerOnly(Method method) {
        String rule = method.getAnnotation(PreAuthorize.class).value();
        assertTrue(rule.contains("BUSINESS_OWNER"));
        assertTrue(rule.contains("OWNER"));
        assertFalse(rule.contains("ADMIN"));
        assertFalse(rule.contains("EMPLOYEE"));
    }
}
