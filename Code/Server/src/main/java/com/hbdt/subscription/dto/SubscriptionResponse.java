package com.hbdt.subscription.dto;

import com.hbdt.entity.Subscription;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private Long businessId;
    private Long planId;
    private String planCode;
    private String planName;
    private String billingCycle;
    private LocalDate startDate;
    private LocalDate endDate;
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
                .businessId(subscription.getBusinessId())
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
