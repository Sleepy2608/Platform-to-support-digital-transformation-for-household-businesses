package com.hbdt.payment.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.payment.dto.CreatePaymentRequest;
import com.hbdt.payment.dto.CustomerDebtSummaryResponse;
import com.hbdt.payment.dto.OrderPaymentSummaryResponse;
import com.hbdt.payment.dto.PaymentResponse;
import com.hbdt.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API ghi nhận và tra cứu thanh toán đơn hàng.
 * Phân quyền: Employee và Owner đều được tạo/xem thanh toán.
 */
@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ==================== Tạo giao dịch thanh toán ====================

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(
                authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ghi nhận thanh toán thành công", response));
    }

    // ==================== Tra cứu thanh toán theo đơn hàng ====================

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getOrderPayments(
            Authentication authentication,
            @PathVariable Long orderId) {
        List<PaymentResponse> payments = paymentService.getOrderPayments(
                authentication.getName(), orderId);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách thanh toán theo đơn hàng thành công", payments));
    }

    @GetMapping("/orders/{orderId}/summary")
    public ResponseEntity<ApiResponse<OrderPaymentSummaryResponse>> getOrderPaymentSummary(
            Authentication authentication,
            @PathVariable Long orderId) {
        OrderPaymentSummaryResponse summary = paymentService.getOrderPaymentSummary(
                authentication.getName(), orderId);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy tổng quan thanh toán đơn hàng thành công", summary));
    }

    // ==================== Lịch sử thanh toán theo khách hàng ====================

    @GetMapping("/customers/{customerId}/history")
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> getCustomerPaymentHistory(
            Authentication authentication,
            @PathVariable Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<PaymentResponse> history = paymentService.getCustomerPaymentHistory(
                authentication.getName(), customerId, page, size);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy lịch sử thanh toán khách hàng thành công", history));
    }

    @GetMapping("/customers/{customerId}/debt-summary")
    public ResponseEntity<ApiResponse<CustomerDebtSummaryResponse>> getCustomerDebtSummary(
            Authentication authentication,
            @PathVariable Long customerId) {
        CustomerDebtSummaryResponse summary = paymentService.getCustomerDebtSummary(
                authentication.getName(), customerId);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy tổng quan công nợ khách hàng thành công", summary));
    }
}
