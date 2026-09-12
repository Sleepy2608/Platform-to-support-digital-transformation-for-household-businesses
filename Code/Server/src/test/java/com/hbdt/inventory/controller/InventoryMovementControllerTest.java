package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.InventoryAdjustmentRequest;
import com.hbdt.inventory.dto.InventoryAdjustmentResponse;
import com.hbdt.inventory.dto.InventoryBalanceResponse;
import com.hbdt.inventory.service.InventoryMovementService;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.inventory.dto.InventoryTransactionFilterRequest;
import com.hbdt.inventory.dto.InventoryTransactionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryMovementControllerTest {

    @Mock
    private InventoryMovementService inventoryMovementService;

    @Mock
    private Authentication authentication;

    private InventoryMovementController controller;

    @BeforeEach
    void setUp() {
        controller = new InventoryMovementController(inventoryMovementService);
    }

    @Test
    void adjustStock_Success_ReturnsAdjustedResponse() {
        InventoryAdjustmentRequest request = new InventoryAdjustmentRequest(
                10L, 2L, new BigDecimal("15.000"),
                "SET", "Kiểm kê định kỳ tháng 9 phát hiện thừa hàng"
        );

        InventoryAdjustmentResponse expectedResponse = InventoryAdjustmentResponse.builder()
                .transactionId(100L)
                .productId(10L)
                .productName("Sữa tươi")
                .productCode("SP01")
                .enteredUnitId(2L)
                .enteredUnitName("Thùng")
                .enteredQuantity(new BigDecimal("15.000"))
                .conversionRate(BigDecimal.ONE)
                .baseUnitId(2L)
                .baseUnitName("Thùng")
                .baseQuantity(new BigDecimal("15.000"))
                .quantityChange(new BigDecimal("5.000"))
                .balanceBefore(new BigDecimal("10.000"))
                .balanceAfter(new BigDecimal("15.000"))
                .unitCost(new BigDecimal("50000.00"))
                .transactionValue(new BigDecimal("250000.00"))
                .balanceValue(new BigDecimal("750000.00"))
                .adjustmentType("SET")
                .reason("Kiểm kê định kỳ tháng 9 phát hiện thừa hàng")
                .adjustedById(1L)
                .adjustedByUsername("owner")
                .adjustedAt(LocalDateTime.now())
                .build();

        when(authentication.getName()).thenReturn("owner");
        when(inventoryMovementService.adjustStock("owner", request)).thenReturn(expectedResponse);

        ResponseEntity<ApiResponse<InventoryAdjustmentResponse>> response =
                controller.adjustStock(authentication, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Điều chỉnh tồn kho thành công");
        assertThat(response.getBody().getData()).isEqualTo(expectedResponse);
        verify(inventoryMovementService).adjustStock("owner", request);
    }

    @Test
    void adjustStock_PreAuthorizeAnnotation_RequiresBusinessOwnerOrOwner() throws NoSuchMethodException {
        Method adjustStockMethod = InventoryMovementController.class.getMethod(
                "adjustStock", Authentication.class, InventoryAdjustmentRequest.class
        );

        PreAuthorize annotation = adjustStockMethod.getAnnotation(PreAuthorize.class);
        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).isEqualTo("hasAnyRole('BUSINESS_OWNER', 'OWNER')");
        assertThat(annotation.value()).doesNotContain("EMPLOYEE");
    }

    @Test
    void getBalance_Success_ReturnsBalanceResponse() {
        InventoryBalanceResponse balanceResponse = new InventoryBalanceResponse(
                10L, 2L, "Kilôgam", new BigDecimal("10.000"),
                new BigDecimal("50000.00"), new BigDecimal("500000.00")
        );

        when(authentication.getName()).thenReturn("owner");
        when(inventoryMovementService.getBalance("owner", 10L)).thenReturn(balanceResponse);

        ResponseEntity<ApiResponse<InventoryBalanceResponse>> response =
                controller.getBalance(authentication, 10L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualTo(balanceResponse);
        verify(inventoryMovementService).getBalance("owner", 10L);
    }

    @Test
    void getTransactions_Success_PassesParametersToService() {
        InventoryTransactionResponse txItem = InventoryTransactionResponse.builder()
                .transactionId(1L)
                .productId(10L)
                .productName("Sữa tươi")
                .productCode("SP01")
                .transactionType("STOCK_IN")
                .referenceType("STOCK_IMPORT")
                .referenceId(101L)
                .enteredQuantity(new BigDecimal("10.000"))
                .baseQuantity(new BigDecimal("10.000"))
                .quantityBefore(BigDecimal.ZERO)
                .quantityChange(new BigDecimal("10.000"))
                .quantityAfter(new BigDecimal("10.000"))
                .unitName("Hộp")
                .unitCost(new BigDecimal("20000.00"))
                .transactionValue(new BigDecimal("200000.00"))
                .note("Nhập kho ban đầu")
                .createdByName("owner")
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<InventoryTransactionResponse> pageResponse = new PageResponse<>(
                List.of(txItem), 0, 20, 1L, 1, true, true
        );

        when(authentication.getName()).thenReturn("owner");
        ArgumentCaptor<InventoryTransactionFilterRequest> filterCaptor =
                ArgumentCaptor.forClass(InventoryTransactionFilterRequest.class);
        when(inventoryMovementService.getTransactions(eq("owner"), filterCaptor.capture()))
                .thenReturn(pageResponse);

        ResponseEntity<ApiResponse<PageResponse<InventoryTransactionResponse>>> response =
                controller.getTransactions(
                        authentication, 10L, "STOCK_IN",
                        "2026-09-01", "2026-09-09", "STOCK_IMPORT", 101L, 0, 20
                );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEqualTo(pageResponse);

        InventoryTransactionFilterRequest capturedFilter = filterCaptor.getValue();
        assertThat(capturedFilter.productId()).isEqualTo(10L);
        assertThat(capturedFilter.transactionType()).isEqualTo("STOCK_IN");
        assertThat(capturedFilter.from()).isEqualTo("2026-09-01");
        assertThat(capturedFilter.to()).isEqualTo("2026-09-09");
        assertThat(capturedFilter.referenceType()).isEqualTo("STOCK_IMPORT");
        assertThat(capturedFilter.referenceId()).isEqualTo(101L);
        assertThat(capturedFilter.page()).isEqualTo(0);
        assertThat(capturedFilter.size()).isEqualTo(20);
    }
}
