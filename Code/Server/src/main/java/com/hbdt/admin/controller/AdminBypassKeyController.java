package com.hbdt.admin.controller;

import com.hbdt.admin.dto.bypasskey.BypassKeyCreateRequest;
import com.hbdt.admin.dto.bypasskey.BypassKeyResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeyStatusUpdateRequest;
import com.hbdt.admin.dto.bypasskey.BypassKeySummaryResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeyUsageResponse;
import com.hbdt.admin.service.BypassKeyAdminService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.enums.BypassKeyStatus;
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
@RequestMapping("/api/admin/bypass-keys")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBypassKeyController {

    private final BypassKeyAdminService bypassKeyAdminService;

    public AdminBypassKeyController(BypassKeyAdminService bypassKeyAdminService) {
        this.bypassKeyAdminService = bypassKeyAdminService;
    }

    /**
     * GET /api/admin/bypass-keys/generate-code
     * Tiện ích sinh trước một mã ngẫu nhiên 20 ký tự chữ và số cho Admin xem trước trên UI modal.
     */
    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = bypassKeyAdminService.generateSecure20DigitCode();
        return ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noCache().noStore().mustRevalidate())
                .body(ApiResponse.success("Sinh mã Bypass Key ngẫu nhiên thành công", Map.of("keyCode", code)));
    }

    /**
     * GET /api/admin/bypass-keys/summary
     * Lấy các số liệu thống kê tổng hợp (tổng số key, đang hoạt động, hết lượt, tổng lượt dùng).
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BypassKeySummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin thống kê thành công", bypassKeyAdminService.getSummary()));
    }

    /**
     * GET /api/admin/bypass-keys
     * Tìm kiếm và phân trang danh sách Bypass Key.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BypassKeyResponse>>> searchKeys(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BypassKeyStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<BypassKeyResponse> result = bypassKeyAdminService.searchKeys(keyword, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Bypass Key thành công", result));
    }

    /**
     * GET /api/admin/bypass-keys/{id}
     * Lấy chi tiết một Bypass Key theo ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BypassKeyResponse>> getKeyById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Bypass Key thành công", bypassKeyAdminService.getKeyById(id)));
    }

    /**
     * POST /api/admin/bypass-keys
     * Tạo một Bypass Key mới.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BypassKeyResponse>> createKey(
            @Valid @RequestBody BypassKeyCreateRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        BypassKeyResponse response = bypassKeyAdminService.createKey(request, adminUsername);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo Bypass Key mới thành công", response));
    }

    /**
     * PUT /api/admin/bypass-keys/{id}/status
     * Cập nhật trạng thái Bypass Key (ACTIVE, DISABLED...).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BypassKeyResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BypassKeyStatusUpdateRequest request) {
        BypassKeyResponse response = bypassKeyAdminService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái Bypass Key thành công", response));
    }

    /**
     * DELETE /api/admin/bypass-keys/{id}
     * Xóa Bypass Key (chỉ cho phép nếu key chưa có lượt sử dụng nào).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKey(@PathVariable Long id) {
        bypassKeyAdminService.deleteKey(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa Bypass Key thành công", null));
    }

    /**
     * GET /api/admin/bypass-keys/{id}/usages
     * Lấy danh sách lịch sử sử dụng của một Bypass Key.
     */
    @GetMapping("/{id}/usages")
    public ResponseEntity<ApiResponse<List<BypassKeyUsageResponse>>> getKeyUsages(@PathVariable Long id) {
        List<BypassKeyUsageResponse> usages = bypassKeyAdminService.getKeyUsages(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử sử dụng Bypass Key thành công", usages));
    }
}

