package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.InventoryBookkeepingSummaryResponse;
import com.hbdt.inventory.dto.InventoryLedgerResponse;
import com.hbdt.inventory.service.InventoryBookkeepingService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryBookkeepingControllerTest {

    @Mock
    private InventoryBookkeepingService bookkeepingService;

    @Mock
    private Authentication authentication;

    private InventoryBookkeepingController controller;

    @BeforeEach
    void setUp() {
        controller = new InventoryBookkeepingController(bookkeepingService);
    }

    @Test
    void getLedger_Success_ReturnsLedgerResponse() {
        InventoryLedgerResponse ledgerResponse = InventoryLedgerResponse.builder()
                .businessId(1L)
                .businessName("Tiệm Tạp Hóa An Nhiên")
                .productId(10L)
                .productCode("SP01")
                .productName("Sữa tươi")
                .unitName("Hộp")
                .openingQuantity(new BigDecimal("10.000"))
                .openingAmount(new BigDecimal("200000.00"))
                .entries(List.of())
                .closingQuantity(new BigDecimal("10.000"))
                .closingAmount(new BigDecimal("200000.00"))
                .build();

        when(authentication.getName()).thenReturn("owner");
        when(bookkeepingService.getLedger("owner", 10L, "2026-09-01", "2026-09-30"))
                .thenReturn(ledgerResponse);

        ResponseEntity<ApiResponse<InventoryLedgerResponse>> response =
                controller.getLedger(authentication, 10L, "2026-09-01", "2026-09-30", null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualTo(ledgerResponse);
        verify(bookkeepingService).getLedger("owner", 10L, "2026-09-01", "2026-09-30");
    }

    @Test
    void getSummary_Success_ReturnsSummaryResponse() {
        InventoryBookkeepingSummaryResponse summaryResponse = InventoryBookkeepingSummaryResponse.builder()
                .businessId(1L)
                .businessName("Tiệm Tạp Hóa An Nhiên")
                .startDate(LocalDateTime.now().minusDays(30))
                .endDate(LocalDateTime.now())
                .totalImportQuantity(new BigDecimal("100.000"))
                .totalExportQuantity(new BigDecimal("50.000"))
                .productSummaries(List.of())
                .build();

        when(authentication.getName()).thenReturn("owner");
        when(bookkeepingService.getSummary("owner", 10L, "2026-09-01", "2026-09-30"))
                .thenReturn(summaryResponse);

        ResponseEntity<ApiResponse<InventoryBookkeepingSummaryResponse>> response =
                controller.getSummary(authentication, 10L, "2026-09-01", "2026-09-30", null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualTo(summaryResponse);
        verify(bookkeepingService).getSummary("owner", 10L, "2026-09-01", "2026-09-30");
    }

    @Test
    void controllerHasSecurityAnnotation() {
        PreAuthorize annotation = InventoryBookkeepingController.class.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).contains("BUSINESS_OWNER", "OWNER", "EMPLOYEE");
    }
}
