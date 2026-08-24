package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.inventory.dto.InventoryBalanceResponse;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.inventory.service.InventoryMovementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class InventoryMovementController {

    private final InventoryMovementService inventoryMovementService;

    public InventoryMovementController(InventoryMovementService inventoryMovementService) {
        this.inventoryMovementService = inventoryMovementService;
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<InventoryBalanceResponse>> getBalance(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryMovementService.getBalance(authentication.getName(), productId)
        ));
    }

    @PostMapping("/stock-in")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryMovementResponse>> stockIn(
            Authentication authentication,
            @Valid @RequestBody InventoryMovementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Nhập kho và quy đổi số lượng thành công",
                inventoryMovementService.stockIn(authentication.getName(), request)
        ));
    }

    @PostMapping("/stock-out")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryMovementResponse>> stockOut(
            Authentication authentication,
            @Valid @RequestBody InventoryMovementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Xuất kho và quy đổi số lượng thành công",
                inventoryMovementService.stockOut(authentication.getName(), request)
        ));
    }
}
