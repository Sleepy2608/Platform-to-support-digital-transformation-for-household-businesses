package com.hbdt.customer.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.dto.CustomerPurchaseHistoryPageResponse;
import com.hbdt.customer.dto.CustomerPurchaseSummaryResponse;
import com.hbdt.customer.dto.QuickCreateCustomerRequest;
import com.hbdt.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // ===== CRUD APIs (HBDT-47) =====

    /**
     * POST /api/customers — Thêm mới khách hàng.
     * Owner + Employee đều được phép.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CustomerCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo khách hàng thành công",
                customerService.create(authentication.getName(), request)));
    }

    /**
     * GET /api/customers — Lấy danh sách khách hàng.
     * Hỗ trợ Search (keyword), Filter status, Pagination (page, size).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CustomerListResponse>>> getList(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách khách hàng thành công",
                customerService.getList(authentication.getName(), keyword, status, page, size)));
    }

    /**
     * GET /api/customers/{id} — Xem chi tiết khách hàng (kèm debt_balance).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getDetail(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy thông tin khách hàng thành công",
                customerService.getDetail(authentication.getName(), id)));
    }

    /**
     * PUT /api/customers/{id} — Cập nhật thông tin khách hàng.
     * Chỉ Owner được phép (Employee không được trừ khi có permission flag).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật khách hàng thành công",
                customerService.update(authentication.getName(), id, request)));
    }

    /**
     * PATCH /api/customers/{id}/status — Đổi trạng thái (Vô hiệu hóa / Kích hoạt lại).
     * Chỉ Owner được phép.
     * Nếu debt_balance > 0, trả về lỗi không cho phép vô hiệu hóa.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> changeStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CustomerStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật trạng thái khách hàng thành công",
                customerService.changeStatus(authentication.getName(), id, request)));
    }

    // ===== Existing APIs (preserved) =====

    /**
     * GET /api/customers/options — Dropdown options cho chọn khách hàng.
     */
    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<CustomerOptionResponse>>> searchOptions(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.searchOptions(authentication.getName(), keyword, limit)));
    }

    /**
     * POST /api/customers/quick — Tạo nhanh khách hàng (dùng từ Order).
     */
    @PostMapping("/quick")
    public ResponseEntity<ApiResponse<CustomerOptionResponse>> quickCreate(
            Authentication authentication,
            @Valid @RequestBody QuickCreateCustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Đăng ký khách hàng thành công",
                customerService.quickCreate(authentication.getName(), request)));
    }

    @GetMapping("/{customerId}/purchase-history")
    public ResponseEntity<ApiResponse<CustomerPurchaseHistoryPageResponse>> getPurchaseHistory(
            Authentication authentication,
            @PathVariable Long customerId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getPurchaseHistory(authentication.getName(), customerId, keyword, startDate, endDate, paymentStatus, page, size)
        ));
    }

    @GetMapping("/{customerId}/purchase-summary")
    public ResponseEntity<ApiResponse<CustomerPurchaseSummaryResponse>> getPurchaseSummary(
            Authentication authentication,
            @PathVariable Long customerId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getPurchaseSummary(authentication.getName(), customerId)
        ));
    }
}
