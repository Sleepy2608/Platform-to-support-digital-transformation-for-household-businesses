package com.hbdt.admin.dto.bypasskey;

import com.hbdt.entity.BypassKey;
import com.hbdt.entity.enums.BypassKeyStatus;
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
public class BypassKeyResponse {

    private Long id;
    private String keyCode;
    private Integer maxUses;
    private Integer usedCount;
    private Integer discountPercent;
    private BypassKeyStatus status;
    private String statusDescription;
    private String note;
    private LocalDateTime expiresAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isUsable;

    public static BypassKeyResponse fromEntity(BypassKey entity) {
        if (entity == null) {
            return null;
        }

        return BypassKeyResponse.builder()
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

