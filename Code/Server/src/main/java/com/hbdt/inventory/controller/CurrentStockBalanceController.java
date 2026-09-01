package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entitlement.annotation.RequireFeature;
import com.hbdt.inventory.dto.CurrentStockBalanceResponse;
import com.hbdt.inventory.service.CurrentStockBalanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/balances")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
@RequireFeature("INVENTORY_MANAGEMENT")
public class CurrentStockBalanceController {

    private final CurrentStockBalanceService currentStockBalanceService;

    public CurrentStockBalanceController(CurrentStockBalanceService currentStockBalanceService) {
        this.currentStockBalanceService = currentStockBalanceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CurrentStockBalanceResponse>>> getCurrentBalances(
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy tồn kho hiện tại thành công",
                currentStockBalanceService.getCurrentBalances(authentication.getName())
        ));
    }
}
