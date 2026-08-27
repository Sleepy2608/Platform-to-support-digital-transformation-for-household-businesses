package com.hbdt.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelSubscriptionRequest {
    @NotBlank(message = "Lý do hủy không được để trống")
    private String reason;
}
