package com.hbdt.order.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.order.dto.SalesOrderPageResponse;
import com.hbdt.order.service.SalesOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/sales-orders")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'EMPLOYEE')")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SalesOrderResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CreateSalesOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo đơn hàng và chụp giá bán thành công",
                salesOrderService.create(authentication.getName(), request)
        ));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> get(
            Authentication authentication,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                salesOrderService.get(authentication.getName(), orderId)
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SalesOrderPageResponse>> search(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                salesOrderService.search(authentication.getName(), keyword, status, source, page, size)
        ));
    }
}
