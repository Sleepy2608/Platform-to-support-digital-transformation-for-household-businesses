package com.hbdt.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancelSubscriptionRequest {
    @NotBlank(message = "Lý do hủy không được để trống")
    @Size(max = 500, message = "Lý do hủy không được vượt quá 500 ký tự")
    private String reason;
}
