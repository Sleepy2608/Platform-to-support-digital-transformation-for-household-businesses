package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.User;
import com.hbdt.repository.UserRepository;
import com.hbdt.subscription.dto.ServiceInvoiceResponse;
import com.hbdt.subscription.service.ISubscriptionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/owner/invoices")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class ServiceInvoiceController {

    private final ISubscriptionService subscriptionService;
    private final UserRepository userRepository;

    public ServiceInvoiceController(ISubscriptionService subscriptionService, UserRepository userRepository) {
        this.subscriptionService = subscriptionService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
    }

    /**
     * GET /api/owner/invoices
     * Lấy danh sách lịch sử hóa đơn dịch vụ của chủ kinh doanh
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceInvoiceResponse>>> getInvoiceHistory(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        List<ServiceInvoiceResponse> invoices = subscriptionService.getOwnerInvoiceHistory(user, status, fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử hóa đơn thành công", invoices));
    }

    /**
     * GET /api/owner/invoices/{id}
     * Lấy chi tiết hóa đơn dịch vụ
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceInvoiceResponse>> getInvoiceDetail(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);
        ServiceInvoiceResponse invoice = subscriptionService.getOwnerInvoiceDetail(id, user);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết hóa đơn thành công", invoice));
    }
}
