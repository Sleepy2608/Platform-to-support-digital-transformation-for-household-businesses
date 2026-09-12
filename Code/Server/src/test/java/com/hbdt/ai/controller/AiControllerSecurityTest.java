package com.hbdt.ai.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.junit.jupiter.api.Assertions.*;

class AiControllerSecurityTest {
    @Test
    void aiEndpointsAllowEmployeeAndOwner() {
        String rule = AiController.class.getAnnotation(PreAuthorize.class).value();
        assertTrue(rule.contains("BUSINESS_OWNER"));
        assertTrue(rule.contains("EMPLOYEE"));
    }
}
