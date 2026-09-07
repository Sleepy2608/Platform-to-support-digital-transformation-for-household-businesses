package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.annotation.RequireFeature;
import com.hbdt.inventory.dto.CurrentStockBalanceResponse;
import com.hbdt.inventory.service.CurrentStockBalanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentStockBalanceControllerTest {

    @Mock private CurrentStockBalanceService service;
    @Mock private Authentication authentication;

    private CurrentStockBalanceController controller;

    @BeforeEach
    void setUp() {
        controller = new CurrentStockBalanceController(service);
    }

    @Test
    void returnsCurrentBalancesForAuthenticatedBusiness() {
        CurrentStockBalanceResponse item = new CurrentStockBalanceResponse(
                11L, "SP-01", "Cà phê", 3L, "Đồ uống", 2L, "Kilôgam",
                new BigDecimal("12.500"), new BigDecimal("75000.00"),
                new BigDecimal("937500.00"), null);
        when(authentication.getName()).thenReturn("owner");
        when(service.getCurrentBalances("owner")).thenReturn(List.of(item));

        ResponseEntity<ApiResponse<List<CurrentStockBalanceResponse>>> response =
                controller.getCurrentBalances(authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).containsExactly(item);
        verify(service).getCurrentBalances("owner");
    }

    @Test
    void endpointAllowsOwnerAndEmployeeAndRequiresInventoryFeature() {
        PreAuthorize security = CurrentStockBalanceController.class.getAnnotation(PreAuthorize.class);
        RequireFeature feature = CurrentStockBalanceController.class.getAnnotation(RequireFeature.class);

        assertThat(security).isNotNull();
        assertThat(security.value()).contains("BUSINESS_OWNER", "OWNER", "EMPLOYEE");
        assertThat(feature).isNotNull();
        assertThat(feature.value()).isEqualTo("INVENTORY_MANAGEMENT");
    }
}
