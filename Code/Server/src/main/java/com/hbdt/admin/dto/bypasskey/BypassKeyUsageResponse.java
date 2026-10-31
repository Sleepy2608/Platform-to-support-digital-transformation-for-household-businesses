package com.hbdt.admin.dto.bypasskey;

import com.hbdt.entity.BypassKeyUsage;
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
public class BypassKeyUsageResponse {

    private Long id;
    private Long bypassKeyId;
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

    public static BypassKeyUsageResponse fromEntity(BypassKeyUsage entity) {
        if (entity == null) {
            return null;
        }

        return BypassKeyUsageResponse.builder()
                .id(entity.getId())
                .bypassKeyId(entity.getBypassKey() != null ? entity.getBypassKey().getId() : null)
                .keyCode(entity.getBypassKey() != null ? entity.getBypassKey().getKeyCode() : null)
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

