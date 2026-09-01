package com.hbdt.entitlement.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.dto.FeatureMatrixResponse;
import com.hbdt.entitlement.dto.FeatureRequest;
import com.hbdt.entitlement.dto.FeatureResponse;
import com.hbdt.entitlement.dto.MapFeatureRequest;
import com.hbdt.entitlement.dto.PackageFeatureResponse;
import com.hbdt.entitlement.service.FeatureAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin API cho quản lý features và feature-package matrix.
 * Bảo vệ bởi SecurityConfig: /api/admin/** → hasRole(ADMIN).
 */
@RestController
@RequestMapping("/api/admin/features")
public class FeatureAdminController {

    private final FeatureAdminService featureAdminService;

    public FeatureAdminController(FeatureAdminService featureAdminService) {
        this.featureAdminService = featureAdminService;
    }

    // ─── Feature CRUD ─────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureResponse>>> getAllFeatures() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách tính năng thành công",
                featureAdminService.getAllFeatures()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureResponse>> getFeature(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy tính năng thành công",
                featureAdminService.getFeature(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureResponse>> createFeature(
            @Valid @RequestBody FeatureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Tạo tính năng thành công",
                        featureAdminService.createFeature(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureResponse>> updateFeature(
            @PathVariable Long id,
            @Valid @RequestBody FeatureRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật tính năng thành công",
                featureAdminService.updateFeature(id, request)));
    }

    /**
     * Toggle bật/tắt feature — Dynamic Config, không cần deploy lại.
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<FeatureResponse>> toggleFeature(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Thay đổi trạng thái tính năng thành công",
                featureAdminService.toggleFeature(id)));
    }

    // ─── Feature Matrix ───────────────────────────────────────────────────────────

    @GetMapping("/matrix")
    public ResponseEntity<ApiResponse<FeatureMatrixResponse>> getFeatureMatrix() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy ma trận tính năng thành công",
                featureAdminService.getFeatureMatrix()));
    }

    @GetMapping("/matrix/{planId}")
    public ResponseEntity<ApiResponse<List<PackageFeatureResponse>>> getMappingsByPlan(
            @PathVariable Long planId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách mapping thành công",
                featureAdminService.getMappingsByPlan(planId)));
    }

    @PostMapping("/matrix/map")
    public ResponseEntity<ApiResponse<PackageFeatureResponse>> mapFeature(
            @Valid @RequestBody MapFeatureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Map tính năng vào gói thành công",
                        featureAdminService.mapFeatureToPackage(request)));
    }

    @DeleteMapping("/matrix/unmap")
    public ResponseEntity<ApiResponse<Void>> unmapFeature(
            @RequestParam Long planId,
            @RequestParam Long featureId) {
        featureAdminService.unmapFeatureFromPackage(planId, featureId);
        return ResponseEntity.ok(ApiResponse.success("Unmap tính năng khỏi gói thành công", null));
    }
}
