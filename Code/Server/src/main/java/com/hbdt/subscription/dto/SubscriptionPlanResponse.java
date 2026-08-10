package com.hbdt.subscription.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SubscriptionPlanResponse(
        Long id,
        String planCode,
        String planName,
        BigDecimal monthlyPrice,
        BigDecimal annualPrice,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
