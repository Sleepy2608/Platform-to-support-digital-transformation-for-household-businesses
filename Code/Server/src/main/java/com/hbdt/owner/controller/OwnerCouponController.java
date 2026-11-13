package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.owner.dto.CouponCheckoutResponse;
import com.hbdt.owner.dto.ValidateCouponRequest;
import com.hbdt.owner.dto.ValidateCouponResponse;
import com.hbdt.owner.service.OwnerCouponService;
import com.hbdt.owner.service.CouponCheckoutService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
}
