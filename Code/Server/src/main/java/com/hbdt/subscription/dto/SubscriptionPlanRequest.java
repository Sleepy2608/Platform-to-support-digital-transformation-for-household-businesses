package com.hbdt.subscription.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SubscriptionPlanRequest(
        @NotBlank(message = "Mã gói không được để trống")
        @Size(max = 30, message = "Mã gói không được vượt quá 30 ký tự")
        String planCode,

        @NotBlank(message = "Tên gói không được để trống")
        @Size(max = 100, message = "Tên gói không được vượt quá 100 ký tự")
        String planName,

        @NotNull(message = "Giá theo tháng không được để trống")
        @DecimalMin(value = "0.00", message = "Giá theo tháng không được âm")
        @Digits(integer = 16, fraction = 2, message = "Giá theo tháng không hợp lệ")
        BigDecimal monthlyPrice,

        @NotNull(message = "Giá theo năm không được để trống")
        @DecimalMin(value = "0.00", message = "Giá theo năm không được âm")
        @Digits(integer = 16, fraction = 2, message = "Giá theo năm không hợp lệ")
        BigDecimal annualPrice,

        @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
        String description,

        @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
        String status
) {
}
