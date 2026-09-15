package com.hbdt.admin.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.annotation.Scheduled;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link TemplateVersionScheduler}.
 * Verifies scheduled execution delegation, exception resilience, and annotation contract.
 */
@ExtendWith(MockitoExtension.class)
class TemplateVersionSchedulerTest {

    @Mock
    private FinancialTemplateService templateService;

    private TemplateVersionScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new TemplateVersionScheduler(templateService);
    }

    @Test
    @DisplayName("TC 17: Should delegate to FinancialTemplateService.activateScheduledVersions()")
    void activateScheduledVersions_delegatesToService() {
        when(templateService.activateScheduledVersions()).thenReturn(2);

        scheduler.activateScheduledVersions();

        verify(templateService, times(1)).activateScheduledVersions();
    }

    @Test
    @DisplayName("TC 18: Should handle service exception gracefully without throwing")
    void activateScheduledVersions_handlesExceptionGracefully() {
        when(templateService.activateScheduledVersions()).thenThrow(new RuntimeException("DB connection error"));

        // Should not throw
        scheduler.activateScheduledVersions();

        verify(templateService, times(1)).activateScheduledVersions();
    }

    @Test
    @DisplayName("TC 19: Method must have @Scheduled annotation configured for midnight cron")
    void activateScheduledVersions_hasScheduledAnnotation() throws NoSuchMethodException {
        Method method = TemplateVersionScheduler.class.getMethod("activateScheduledVersions");
        Scheduled scheduled = method.getAnnotation(Scheduled.class);

        assertThat(scheduled).isNotNull();
        assertThat(scheduled.cron()).contains("0 0 0 * * *");
    }
}
