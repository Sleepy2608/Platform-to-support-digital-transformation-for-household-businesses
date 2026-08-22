package com.hbdt.order.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.order.dto.CreateOrderRequest;
import com.hbdt.order.dto.OrderResponse;
import com.hbdt.order.service.OrderService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn hàng thành công", response));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Authentication authentication,
            @PathVariable Long id) {
        OrderResponse response = orderService.cancelOrder(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng và hoàn tồn kho thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit) {
        List<OrderResponse> response = orderService.getRecentOrders(authentication.getName(), limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn hàng thành công", response));
    }
}
