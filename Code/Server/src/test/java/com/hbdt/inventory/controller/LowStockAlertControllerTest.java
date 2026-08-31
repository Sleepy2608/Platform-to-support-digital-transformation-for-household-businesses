package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.LowStockAlertResponse;
import com.hbdt.inventory.dto.LowStockSummaryResponse;
import com.hbdt.inventory.dto.MinimumStockRequest;
import com.hbdt.inventory.dto.StockThresholdResponse;
import com.hbdt.inventory.service.LowStockAlertService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class LowStockAlertControllerTest {

    @Mock private LowStockAlertService service;
    @Mock private Authentication authentication;

    private LowStockAlertController controller;
    private LowStockAlertResponse activeAlert;
    private StockThresholdResponse threshold;

    @BeforeEach
    void setUp() {
        controller = new LowStockAlertController(service);
        lenient().when(authentication.getName()).thenReturn("owner");
        activeAlert = new LowStockAlertResponse(
                91L,
                11L,
                "SP-01",
                "Cà phê",
                new BigDecimal("2.000"),
                new BigDecimal("10.000"),
                "ACTIVE",
                true,
                LocalDateTime.of(2026, 8, 28, 8, 0),
                LocalDateTime.of(2026, 8, 28, 9, 0),
                null);
        threshold = new StockThresholdResponse(
                11L,
                "SP-01",
                "Cà phê",
                new BigDecimal("2.000"),
                new BigDecimal("10.000"),
                true,
                true);
    }

    @Test
    void getActiveAlertsDelegatesToServiceWithHistoryDisabled() {
        when(service.getAlerts("owner", false)).thenReturn(List.of(activeAlert));

        ResponseEntity<ApiResponse<List<LowStockAlertResponse>>> response =
                controller.getAlerts(authentication, false);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).containsExactly(activeAlert);
        assertThat(response.getBody().getMessage()).contains("thành công");
        verify(service).getAlerts("owner", false);
    }

    @Test
    void getAlertHistoryPassesIncludeResolvedFlag() {
        LowStockAlertResponse resolved = new LowStockAlertResponse(
                92L,
                11L,
                "SP-01",
                "Cà phê",
                new BigDecimal("12.000"),
                new BigDecimal("10.000"),
                "RESOLVED",
                false,
                LocalDateTime.of(2026, 8, 27, 8, 0),
                LocalDateTime.of(2026, 8, 27, 9, 0),
                LocalDateTime.of(2026, 8, 28, 10, 0));
        when(service.getAlerts("owner", true)).thenReturn(List.of(activeAlert, resolved));

        ResponseEntity<ApiResponse<List<LowStockAlertResponse>>> response =
                controller.getAlerts(authentication, true);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).containsExactly(activeAlert, resolved);
        verify(service).getAlerts("owner", true);
    }

    @Test
    void getSummaryReturnsCountAndLimitedProductList() {
        LowStockSummaryResponse summary = new LowStockSummaryResponse(12, List.of(activeAlert));
        when(service.getSummary("owner", 5)).thenReturn(summary);

        ResponseEntity<ApiResponse<LowStockSummaryResponse>> response =
                controller.getSummary(authentication, 5);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().totalLowStock()).isEqualTo(12);
        assertThat(response.getBody().getData().products()).containsExactly(activeAlert);
        verify(service).getSummary("owner", 5);
    }

    @Test
    void getSummaryPreservesCustomLimit() {
        LowStockSummaryResponse summary = new LowStockSummaryResponse(120, List.of(activeAlert));
        when(service.getSummary("owner", 25)).thenReturn(summary);

        controller.getSummary(authentication, 25);

        verify(service).getSummary("owner", 25);
    }

    @Test
    void getThresholdsReturnsOwnerProductConfiguration() {
        when(service.getThresholds("owner")).thenReturn(List.of(threshold));

        ResponseEntity<ApiResponse<List<StockThresholdResponse>>> response =
                controller.getThresholds(authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).containsExactly(threshold);
        verify(service).getThresholds("owner");
    }

    @Test
    void configureThresholdReturnsUpdatedProjection() {
        MinimumStockRequest request = new MinimumStockRequest(new BigDecimal("15"));
        StockThresholdResponse updated = new StockThresholdResponse(
                11L,
                "SP-01",
                "Cà phê",
                new BigDecimal("2.000"),
                new BigDecimal("15"),
                true,
                true);
        when(service.configureThreshold("owner", 11L, request.minimumStock()))
                .thenReturn(updated);

        ResponseEntity<ApiResponse<StockThresholdResponse>> response =
                controller.configureThreshold(authentication, 11L, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualTo(updated);
        assertThat(response.getBody().getMessage()).contains("Cập nhật ngưỡng");
        verify(service).configureThreshold("owner", 11L, new BigDecimal("15"));
    }

    @Test
    void minimumStockRequestAcceptsNonNegativeIntegers() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        assertThat(validator.validate(new MinimumStockRequest(BigDecimal.ZERO))).isEmpty();
        assertThat(validator.validate(new MinimumStockRequest(new BigDecimal("999999999999999")))).isEmpty();
    }

    @Test
    void minimumStockRequestRejectsDecimalValue() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        Set<ConstraintViolation<MinimumStockRequest>> violations =
                validator.validate(new MinimumStockRequest(new BigDecimal("10.125")));

        assertThat(violations).singleElement().satisfies(violation ->
                assertThat(violation.getMessage()).containsIgnoringCase("số nguyên"));
    }

    @Test
    void minimumStockRequestRejectsNull() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        Set<ConstraintViolation<MinimumStockRequest>> violations =
                validator.validate(new MinimumStockRequest(null));

        assertThat(violations).singleElement().satisfies(violation ->
                assertThat(violation.getMessage()).containsIgnoringCase("ngưỡng"));
    }

    @Test
    void minimumStockRequestRejectsNegativeValue() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        Set<ConstraintViolation<MinimumStockRequest>> violations =
                validator.validate(new MinimumStockRequest(new BigDecimal("-1")));

        assertThat(violations).singleElement().satisfies(violation ->
                assertThat(violation.getMessage()).containsIgnoringCase("âm"));
    }

    @Test
    void alertEndpointsAllowOwnerAndEmployee() throws Exception {
        assertMethodSecurity(
                "getAlerts",
                new Class<?>[] { Authentication.class, boolean.class },
                "EMPLOYEE");
        assertMethodSecurity(
                "getSummary",
                new Class<?>[] { Authentication.class, int.class },
                "EMPLOYEE");
    }

    @Test
    void thresholdEndpointsAreRestrictedToOwner() throws Exception {
        PreAuthorize listSecurity = annotation(
                "getThresholds", Authentication.class);
        PreAuthorize updateSecurity = annotation(
                "configureThreshold",
                Authentication.class,
                Long.class,
                MinimumStockRequest.class);

        assertThat(listSecurity.value()).contains("BUSINESS_OWNER", "OWNER").doesNotContain("EMPLOYEE");
        assertThat(updateSecurity.value()).contains("BUSINESS_OWNER", "OWNER").doesNotContain("EMPLOYEE");
    }

    private void assertMethodSecurity(
            String methodName,
            Class<?>[] parameterTypes,
            String expectedRole
    ) throws Exception {
        Method method = LowStockAlertController.class.getMethod(methodName, parameterTypes);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).contains("BUSINESS_OWNER", "OWNER", expectedRole);
    }

    private PreAuthorize annotation(String methodName, Class<?>... parameterTypes) throws Exception {
        Method method = LowStockAlertController.class.getMethod(methodName, parameterTypes);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        return annotation;
    }
}
