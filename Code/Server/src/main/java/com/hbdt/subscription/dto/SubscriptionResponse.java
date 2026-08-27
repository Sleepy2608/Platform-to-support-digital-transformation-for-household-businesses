package com.hbdt.subscription.dto;

import com.hbdt.entity.Subscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private Long ownerId;
    private String ownerUsername;
    private Long planId;
    private String planCode;
    private String planName;
    private String billingCycle;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private LocalDateTime cancelledAt;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SubscriptionResponse fromEntity(Subscription subscription) {
        if (subscription == null) {
            return null;
        }
        return SubscriptionResponse.builder()
                .id(subscription.getId())
                .ownerId(subscription.getOwner() != null ? subscription.getOwner().getId() : null)
                .ownerUsername(subscription.getOwner() != null ? subscription.getOwner().getUsername() : null)
                .planId(subscription.getPlan() != null ? subscription.getPlan().getId() : null)
                .planCode(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : null)
                .planName(subscription.getPlan() != null ? subscription.getPlan().getPlanName() : null)
                .billingCycle(subscription.getBillingCycle())
                .startDate(subscription.getStartDate())
                .endDate(subscription.getEndDate())
                .status(subscription.getStatus() != null ? subscription.getStatus().name() : null)
                .cancelledAt(subscription.getCancelledAt())
                .cancellationReason(subscription.getCancellationReason())
                .createdAt(subscription.getCreatedAt())
                .updatedAt(subscription.getUpdatedAt())
                .build();
    }
}
