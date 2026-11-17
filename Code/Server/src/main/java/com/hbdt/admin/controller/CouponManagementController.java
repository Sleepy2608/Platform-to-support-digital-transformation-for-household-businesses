package com.hbdt.admin.controller;

import com.hbdt.admin.dto.coupon.CouponCreateRequest;
import com.hbdt.admin.dto.coupon.CouponResponse;
import com.hbdt.admin.dto.coupon.CouponStatusUpdateRequest;
import com.hbdt.admin.dto.coupon.CouponSummaryResponse;
import com.hbdt.admin.dto.coupon.CouponUsageResponse;
import com.hbdt.admin.service.CouponManagementService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.enums.CouponStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform/coupons")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class CouponManagementController {

    private final CouponManagementService couponAdminService;

    public CouponManagementController(CouponManagementService couponAdminService) {
        this.couponAdminService = couponAdminService;
    }

    /**
     * GET /api/platform/coupons/generate-code
     * Tiện ích sinh trước một mã ngẫu nhiên 20 ký tự chữ và số để xem trước trên UI modal.
     */
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = couponAdminService.generateSecure20DigitCode();
        return ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noCache().noStore().mustRevalidate())
                .body(ApiResponse.success("Sinh mã giảm giá ngẫu nhiên thành công", Map.of("keyCode", code)));
    }

    /**
     * GET /api/platform/coupons/summary
     * Lấy các số liệu thống kê tổng hợp (tổng số key, đang hoạt động, hết lượt, tổng lượt dùng).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CouponSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thống kê thành công", couponAdminService.getSummary()));
    }

    /**
     * GET /api/platform/coupons
     * Tìm kiếm và phân trang danh sách Coupon.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CouponResponse>>> searchKeys(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CouponStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<CouponResponse> result = couponAdminService.searchKeys(keyword, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Coupon thành công", result));
    }

    /**
     * GET /api/platform/coupons/{id}
     * Lấy chi tiết một Coupon theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> getKeyById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Coupon thành công", couponAdminService.getKeyById(id)));
    }

    /**
     * POST /api/platform/coupons
     * Tạo một Coupon mới.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> createKey(
            @Valid @RequestBody CouponCreateRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        CouponResponse response = couponAdminService.createKey(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo Coupon mới thành công", response));
    }

    /**
     * PUT /api/platform/coupons/{id}/status
     * Cập nhật trạng thái Coupon (ACTIVE, DISABLED...).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CouponResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CouponStatusUpdateRequest request) {
        CouponResponse response = couponAdminService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái Coupon thành công", response));
    }

    /**
     * DELETE /api/platform/coupons/{id}
     * Xóa Coupon (chỉ cho phép nếu key chưa có lượt sử dụng nào).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKey(@PathVariable Long id) {
        couponAdminService.deleteKey(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa Coupon thành công", null));
    }

    /**
     * GET /api/platform/coupons/{id}/usages
     * Lấy danh sách lịch sử sử dụng của một Coupon.
     */
    @GetMapping("/{id}/usages")
    public ResponseEntity<ApiResponse<List<CouponUsageResponse>>> getKeyUsages(@PathVariable Long id) {
        List<CouponUsageResponse> usages = couponAdminService.getKeyUsages(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử sử dụng Coupon thành công", usages));
    }
}
