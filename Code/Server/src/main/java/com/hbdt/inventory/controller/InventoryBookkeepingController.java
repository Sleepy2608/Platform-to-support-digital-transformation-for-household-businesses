package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.InventoryBookkeepingSummaryResponse;
import com.hbdt.inventory.dto.InventoryLedgerResponse;
import com.hbdt.inventory.service.InventoryBookkeepingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller phục vụ Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu số S2-HKD theo Thông tư 88/2021/TT-BTC).
 */
@RestController
@RequestMapping("/api/inventory/bookkeeping")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class InventoryBookkeepingController {

    private final InventoryBookkeepingService bookkeepingService;

    public InventoryBookkeepingController(InventoryBookkeepingService bookkeepingService) {
        this.bookkeepingService = bookkeepingService;
    }

    /**
     * Lấy Sổ chi tiết hàng hóa Mẫu S2-HKD cho một sản phẩm.
     * GET /api/inventory/bookkeeping/ledger?productId=1&startDate=2026-09-01&endDate=2026-09-30
     */
    @GetMapping("/ledger")
    public ResponseEntity<ApiResponse<InventoryLedgerResponse>> getLedger(
            Authentication authentication,
            @RequestParam Long productId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        String effectiveStart = startDate != null && !startDate.isBlank() ? startDate : from;
        String effectiveEnd = endDate != null && !endDate.isBlank() ? endDate : to;

        return ResponseEntity.ok(ApiResponse.success(
                bookkeepingService.getLedger(authentication.getName(), productId, effectiveStart, effectiveEnd)
        ));
    }

    /**
     * Lấy Báo cáo tổng hợp tình hình nhập - xuất - tồn kho theo kỳ (Mẫu S2-HKD).
     * GET /api/inventory/bookkeeping/summary?startDate=2026-09-01&endDate=2026-09-30
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<InventoryBookkeepingSummaryResponse>> getSummary(
            Authentication authentication,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        String effectiveStart = startDate != null && !startDate.isBlank() ? startDate : from;
        String effectiveEnd = endDate != null && !endDate.isBlank() ? endDate : to;

        return ResponseEntity.ok(ApiResponse.success(
                bookkeepingService.getSummary(authentication.getName(), productId, effectiveStart, effectiveEnd)
        ));
    }
}
