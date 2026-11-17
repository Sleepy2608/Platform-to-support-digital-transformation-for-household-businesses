package com.hbdt.admin.dto.coupon;

import com.hbdt.entity.Coupon;
import com.hbdt.entity.enums.CouponStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponResponse {

    private Long id;
    private String keyCode;
    private Integer maxUses;
    private Integer usedCount;
    private Integer discountPercent;
    private CouponStatus status;
    private String statusDescription;
    private String note;
    private LocalDateTime expiresAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isUsable;

    public static CouponResponse fromEntity(Coupon entity) {
        if (entity == null) {
            return null;
        }

        return CouponResponse.builder()
                .id(entity.getId())
                .keyCode(entity.getKeyCode())
                .maxUses(entity.getMaxUses())
                .usedCount(entity.getUsedCount())
                .discountPercent(entity.getDiscountPercent())
                .status(entity.getStatus())
                .statusDescription(entity.getStatus() != null ? entity.getStatus().getDescription() : null)
                .note(entity.getNote())
                .expiresAt(entity.getExpiresAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .isUsable(entity.isUsable())
                .build();
    }
}

