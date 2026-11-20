package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.owner.dto.CouponCheckoutResponse;
import com.hbdt.owner.dto.ValidateCouponRequest;
import com.hbdt.owner.dto.ValidateCouponResponse;
import com.hbdt.owner.service.CouponCheckoutService;
import com.hbdt.owner.service.OwnerCouponService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
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
@RequestMapping("/api/owner/coupons")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class OwnerCouponController {

    private final OwnerCouponService ownerCouponService;

    private final CouponCheckoutService checkoutService;

    public OwnerCouponController(OwnerCouponService ownerCouponService, CouponCheckoutService checkoutService) {
        this.ownerCouponService = ownerCouponService;
        this.checkoutService = checkoutService;
    }

    /**
     * POST /api/owner/coupons/validate
     * Kiểm tra tính hợp lệ của mã giảm giá trước khi thực hiện xác nhận thanh toán.
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateKey(
            @Valid @RequestBody ValidateCouponRequest request) {
        ValidateCouponResponse response = ownerCouponService.validateKey(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/checkouts")
    public ResponseEntity<ApiResponse<CouponCheckoutResponse>> createCheckout(
            @Valid @RequestBody ValidateCouponRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(checkoutService.create(authentication.getName(), request)));
    }

    @GetMapping("/checkouts/{reference}")
    public ResponseEntity<ApiResponse<CouponCheckoutResponse>> checkoutStatus(
            @PathVariable String reference, Authentication authentication) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(ApiResponse.success(checkoutService.status(authentication.getName(), reference)));
    }
}
