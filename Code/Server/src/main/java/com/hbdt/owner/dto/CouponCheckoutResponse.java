package com.hbdt.owner.dto;

import com.hbdt.entity.CouponCheckout;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponCheckoutResponse(String reference, BigDecimal finalAmount, LocalDateTime expiresAt, String status) {
    public static CouponCheckoutResponse from(CouponCheckout checkout, LocalDateTime now) {
        String status = checkout.getPaidAt() != null ? "PAID"
                : checkout.getExpiresAt().isAfter(now) ? "PENDING" : "EXPIRED";
        return new CouponCheckoutResponse(checkout.getReference(), checkout.getFinalAmount(), checkout.getExpiresAt(), status);
    }
}
