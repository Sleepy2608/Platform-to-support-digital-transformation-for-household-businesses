package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.LowStockAlertResponse;
import com.hbdt.inventory.dto.LowStockSummaryResponse;
import com.hbdt.inventory.dto.MinimumStockRequest;
import com.hbdt.inventory.dto.StockThresholdResponse;
import com.hbdt.inventory.service.LowStockAlertService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/low-stock")
public class LowStockAlertController {

    private final LowStockAlertService lowStockAlertService;

    public LowStockAlertController(LowStockAlertService lowStockAlertService) {
        this.lowStockAlertService = lowStockAlertService;
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LowStockAlertResponse>>> getAlerts(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean includeResolved) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách cảnh báo tồn kho thành công",
                lowStockAlertService.getAlerts(authentication.getName(), includeResolved)));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<LowStockSummaryResponse>> getSummary(
            Authentication authentication,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                lowStockAlertService.getSummary(authentication.getName(), limit)));
    }

    @GetMapping("/thresholds")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<List<StockThresholdResponse>>> getThresholds(
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                lowStockAlertService.getThresholds(authentication.getName())));
    }

    @PutMapping("/thresholds/{productId}")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<StockThresholdResponse>> configureThreshold(
            Authentication authentication,
            @PathVariable Long productId,
            @Valid @RequestBody MinimumStockRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật ngưỡng tồn kho thành công",
                lowStockAlertService.configureThreshold(
                        authentication.getName(), productId, request.minimumStock())));
    }
}
