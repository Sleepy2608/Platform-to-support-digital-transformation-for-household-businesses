package com.hbdt.customer.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.customer.dto.CustomerPurchaseHistoryPageResponse;
import com.hbdt.customer.dto.CustomerPurchaseSummaryResponse;
import com.hbdt.customer.dto.QuickCreateCustomerRequest;
import com.hbdt.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping("/options")
    public ResponseEntity<ApiResponse<List<CustomerOptionResponse>>> searchOptions(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.searchOptions(authentication.getName(), keyword, limit)));
    }

    @PostMapping("/quick")
    public ResponseEntity<ApiResponse<CustomerOptionResponse>> quickCreate(
            Authentication authentication,
            @Valid @RequestBody QuickCreateCustomerRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Đăng ký khách hàng thành công",
                customerService.quickCreate(authentication.getName(), request)));
    }

    @GetMapping("/{customerId}/purchase-history")
    public ResponseEntity<ApiResponse<CustomerPurchaseHistoryPageResponse>> getPurchaseHistory(
            Authentication authentication,
            @PathVariable Long customerId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getPurchaseHistory(authentication.getName(), customerId, keyword, startDate, endDate, paymentStatus, page, size)
        ));
    }

    @GetMapping("/{customerId}/purchase-summary")
    public ResponseEntity<ApiResponse<CustomerPurchaseSummaryResponse>> getPurchaseSummary(
            Authentication authentication,
            @PathVariable Long customerId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getPurchaseSummary(authentication.getName(), customerId)
        ));
    }
}
