package com.hbdt.owner.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class SubscriptionHistoryDto {
    private Long id;
    private Long subscriptionId;
    private String oldPlan;
    private String newPlan;
    private String action;
    private String changedBy;
    private LocalDateTime changedAt;
}
