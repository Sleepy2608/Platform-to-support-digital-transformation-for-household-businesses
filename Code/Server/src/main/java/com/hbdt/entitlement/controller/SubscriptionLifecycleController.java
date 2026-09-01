package com.hbdt.entitlement.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.service.SubscriptionLifecycleService;
import com.hbdt.entity.Subscription;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API quản lý vòng đời subscription — chỉ dành cho ADMIN.
 * Các endpoint này được bảo vệ bởi SecurityConfig: /api/admin/** → hasRole(ADMIN).
 */
@RestController
@RequestMapping("/api/admin/subscriptions")
public class SubscriptionLifecycleController {

    private final SubscriptionLifecycleService lifecycleService;

    public SubscriptionLifecycleController(SubscriptionLifecycleService lifecycleService) {
        this.lifecycleService = lifecycleService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Long>> createSubscription(
            @RequestParam Long businessId,
            @RequestParam Long planId,
            @RequestParam(defaultValue = "MONTHLY") String billingCycle) {
        Subscription sub = lifecycleService.createSubscription(businessId, planId, billingCycle);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo thuê bao thành công", sub.getId()));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        lifecycleService.activateSubscription(id);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt thuê bao thành công", null));
    }

    @PostMapping("/{id}/expire")
    public ResponseEntity<ApiResponse<Void>> expire(@PathVariable Long id) {
        lifecycleService.expireSubscription(id);
        return ResponseEntity.ok(ApiResponse.success("Thuê bao đã được đánh dấu hết hạn", null));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id) {
        lifecycleService.cancelSubscription(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy thuê bao thành công", null));
    }

    @PostMapping("/change-package")
    public ResponseEntity<ApiResponse<Long>> changePackage(
            @RequestParam Long businessId,
            @RequestParam Long newPlanId,
            @RequestParam(defaultValue = "MONTHLY") String billingCycle) {
        Subscription sub = lifecycleService.changePackage(businessId, newPlanId, billingCycle);
        return ResponseEntity.ok(ApiResponse.success("Thay đổi gói thuê bao thành công", sub.getId()));
    }
}
