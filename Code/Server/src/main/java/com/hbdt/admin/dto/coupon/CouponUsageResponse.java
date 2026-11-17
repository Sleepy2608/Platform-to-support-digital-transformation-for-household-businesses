package com.hbdt.admin.dto.coupon;

import com.hbdt.entity.CouponUsage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponUsageResponse {

    private Long id;
    private Long couponId;
    private String keyCode;
    private Long userId;
    private String username;
    private Long businessId;
    private String packageType;
    private String billingCycle;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private LocalDateTime usedAt;

    public static CouponUsageResponse fromEntity(CouponUsage entity) {
        if (entity == null) {
            return null;
        }

        return CouponUsageResponse.builder()
                .id(entity.getId())
                .couponId(entity.getCoupon() != null ? entity.getCoupon().getId() : null)
                .keyCode(entity.getCoupon() != null ? entity.getCoupon().getKeyCode() : null)
                .userId(entity.getUserId())
                .username(entity.getUsername())
                .businessId(entity.getBusinessId())
                .packageType(entity.getPackageType())
                .billingCycle(entity.getBillingCycle())
                .originalAmount(entity.getOriginalAmount())
                .discountAmount(entity.getDiscountAmount())
                .finalAmount(entity.getFinalAmount())
                .usedAt(entity.getUsedAt())
                .build();
    }
}

