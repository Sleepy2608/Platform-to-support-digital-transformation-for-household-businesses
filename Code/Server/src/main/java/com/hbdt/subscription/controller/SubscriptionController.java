package com.hbdt.subscription.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.repository.UserRepository;
import com.hbdt.subscription.dto.CancelSubscriptionRequest;
import com.hbdt.subscription.dto.SubscriptionResponse;
import com.hbdt.subscription.service.ISubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner/subscriptions")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class SubscriptionController {

    private final ISubscriptionService subscriptionService;
    private final UserRepository userRepository;

    public SubscriptionController(ISubscriptionService subscriptionService, UserRepository userRepository) {
        this.subscriptionService = subscriptionService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại"));
    }

    /**
     * GET /api/subscriptions/current
     * Lấy subscription hiện tại của owner đã đăng nhập.
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getCurrentSubscription(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Subscription subscription = subscriptionService.getCurrentSubscription(user);
        return ResponseEntity.ok(ApiResponse.success("Lấy subscription hiện tại thành công", SubscriptionResponse.fromEntity(subscription)));
    }

    /**
     * GET /api/subscriptions/{id}
     * Lấy chi tiết subscription theo ID (yêu cầu quyền sở hữu).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getSubscriptionDetail(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Subscription subscription = subscriptionService.getSubscriptionById(id, user);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin subscription thành công", SubscriptionResponse.fromEntity(subscription)));
    }

    /**
     * GET /api/subscriptions/{id}/status
     * Lấy trạng thái của subscription theo ID (yêu cầu quyền sở hữu).
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> getSubscriptionStatus(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Subscription subscription = subscriptionService.getSubscriptionById(id, user);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái subscription thành công", subscription.getStatus().name()));
    }

    /**
     * POST /api/subscriptions/{id}/cancel
     * Hủy subscription (yêu cầu quyền sở hữu).
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscriptionPost(
            @PathVariable Long id,
            @Valid @RequestBody CancelSubscriptionRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Subscription cancelled = subscriptionService.cancelSubscription(id, user, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Hủy subscription thành công", SubscriptionResponse.fromEntity(cancelled)));
    }

    /**
     * PUT /api/subscriptions/{id}/cancel
     * Hủy subscription (yêu cầu quyền sở hữu).
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> cancelSubscriptionPut(
            @PathVariable Long id,
            @Valid @RequestBody CancelSubscriptionRequest request,
            Authentication authentication) {
        return cancelSubscriptionPost(id, request, authentication);
    }
}
