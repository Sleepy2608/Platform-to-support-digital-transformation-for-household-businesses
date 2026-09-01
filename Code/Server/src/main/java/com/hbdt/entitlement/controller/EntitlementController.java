package com.hbdt.entitlement.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.dto.EntitlementResult;
import com.hbdt.entitlement.dto.FeatureEntitlementResponse;
import com.hbdt.entitlement.service.FeatureEntitlementService;
import com.hbdt.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API cung cấp thông tin entitlement cho frontend consume.
 *
 * - Owner: GET /api/owner/entitlements
 * - Employee: GET /api/employee/entitlements (resolve theo Owner's subscription)
 * - Quick check: GET /api/owner/entitlements/check?feature={code}
 *
 * Security: businessId luôn lấy từ authenticated user, KHÔNG từ request params.
 */
@RestController
public class EntitlementController {

    private final FeatureEntitlementService featureEntitlementService;

    public EntitlementController(FeatureEntitlementService featureEntitlementService) {
        this.featureEntitlementService = featureEntitlementService;
    }

    /**
     * Lấy danh sách entitlements cho Owner hiện tại.
     */
    @GetMapping("/api/owner/entitlements")
    public ResponseEntity<ApiResponse<List<FeatureEntitlementResponse>>> getOwnerEntitlements(
            @AuthenticationPrincipal User user) {
        Long businessId = featureEntitlementService.resolveBusinessId(user);
        List<FeatureEntitlementResponse> entitlements =
                featureEntitlementService.getEntitlementsByBusinessId(businessId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quyền tính năng thành công", entitlements));
    }

    /**
     * Lấy danh sách entitlements cho Employee — resolve theo Owner's subscription.
     */
    @GetMapping("/api/employee/entitlements")
    public ResponseEntity<ApiResponse<List<FeatureEntitlementResponse>>> getEmployeeEntitlements(
            @AuthenticationPrincipal User user) {
        Long businessId = featureEntitlementService.resolveBusinessId(user);
        List<FeatureEntitlementResponse> entitlements =
                featureEntitlementService.getEntitlementsByBusinessId(businessId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách quyền tính năng thành công", entitlements));
    }

    /**
     * Quick check 1 feature cụ thể — dùng cho lazy check trên frontend.
     */
    @GetMapping("/api/owner/entitlements/check")
    public ResponseEntity<ApiResponse<EntitlementResult>> checkFeature(
            @AuthenticationPrincipal User user,
            @RequestParam String feature) {
        Long businessId = featureEntitlementService.resolveBusinessId(user);
        EntitlementResult result = featureEntitlementService.checkEntitlement(businessId, feature);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra quyền tính năng thành công", result));
    }
}
