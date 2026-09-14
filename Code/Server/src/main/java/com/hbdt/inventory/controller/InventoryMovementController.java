package com.hbdt.inventory.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.inventory.dto.InventoryAdjustmentRequest;
import com.hbdt.inventory.dto.InventoryAdjustmentResponse;
import com.hbdt.inventory.dto.InventoryBalanceResponse;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.inventory.dto.InventoryTransactionFilterRequest;
import com.hbdt.inventory.dto.InventoryTransactionResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
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

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<PageResponse<InventoryTransactionResponse>>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder()
                .productId(productId)
                .transactionType(transactionType)
                .from(from)
                .to(to)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .page(page)
                .size(size)
                .build();
        return ResponseEntity.ok(ApiResponse.success(
                inventoryMovementService.getTransactions(authentication.getName(), filter)
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

    @PostMapping("/adjustment")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<InventoryAdjustmentResponse>> adjustStock(
            Authentication authentication,
            @Valid @RequestBody InventoryAdjustmentRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Điều chỉnh tồn kho thành công",
                inventoryMovementService.adjustStock(authentication.getName(), request)
        ));
    }
}
