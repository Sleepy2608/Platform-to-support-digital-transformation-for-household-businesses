package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.subscription.dto.SubscriptionPlanResponse;
import com.hbdt.subscription.service.SubscriptionPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/subscription-plans")
public class PublicSubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    public PublicSubscriptionPlanController(SubscriptionPlanService subscriptionPlanService) {
        this.subscriptionPlanService = subscriptionPlanService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getActivePlans() {
        return ResponseEntity.ok(ApiResponse.success("Lấy bảng giá thành công",
                subscriptionPlanService.getPublicPlans()));
    }
}
