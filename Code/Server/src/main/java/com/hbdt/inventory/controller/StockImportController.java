package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.annotation.RequireFeature;
import com.hbdt.inventory.dto.StockImportPageResponse;
import com.hbdt.inventory.dto.StockImportRequest;
import com.hbdt.inventory.dto.StockImportResponse;
import com.hbdt.inventory.service.StockImportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API quản lý phiếu nhập kho — dành cho Owner.
 */
@RestController
@RequestMapping("/api/stock-imports")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
@RequireFeature("INVENTORY_MANAGEMENT")
public class StockImportController {

    private final StockImportService stockImportService;

    public StockImportController(StockImportService stockImportService) {
        this.stockImportService = stockImportService;
    }

    /** Tạo phiếu nhập kho mới (Draft). */
    @PostMapping
    public ResponseEntity<ApiResponse<StockImportResponse>> create(
            Authentication authentication,
            @Valid @RequestBody StockImportRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo phiếu nhập kho thành công",
                stockImportService.create(authentication.getName(), request)
        ));
    }

    /** Xem chi tiết phiếu nhập kho. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockImportResponse>> getDetail(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                stockImportService.getDetail(authentication.getName(), id)
        ));
    }

    /** Danh sách phiếu nhập kho (phân trang + search). */
    @GetMapping
    public ResponseEntity<ApiResponse<StockImportPageResponse>> search(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                stockImportService.search(authentication.getName(), keyword, page, size)
        ));
    }

    /** Xác nhận phiếu nhập kho (Draft → Confirmed, cập nhật tồn kho). */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<StockImportResponse>> confirm(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Xác nhận nhập kho thành công, tồn kho đã được cập nhật",
                stockImportService.confirm(authentication.getName(), id)
        ));
    }
}
