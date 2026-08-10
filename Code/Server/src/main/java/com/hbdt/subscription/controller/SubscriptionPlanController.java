package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.subscription.dto.SubscriptionPlanRequest;
import com.hbdt.subscription.dto.SubscriptionPlanResponse;
import com.hbdt.subscription.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subscription-plans")
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    public SubscriptionPlanController(SubscriptionPlanService subscriptionPlanService) {
        this.subscriptionPlanService = subscriptionPlanService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói thuê bao thành công",
                subscriptionPlanService.search(keyword, status)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy gói thuê bao thành công", subscriptionPlanService.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> create(
            @Valid @RequestBody SubscriptionPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo gói thuê bao thành công", subscriptionPlanService.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật gói thuê bao thành công",
                subscriptionPlanService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa gói thuê bao thành công",
                subscriptionPlanService.deactivate(id)));
    }
}
