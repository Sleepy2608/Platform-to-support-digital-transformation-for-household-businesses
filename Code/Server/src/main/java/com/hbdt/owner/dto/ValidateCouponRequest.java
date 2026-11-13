package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValidateCouponRequest {

    @NotBlank(message = "Mã giảm giá không được để trống")
    private String keyCode;

    private String packageType;

    private String billingCycle;

    @Min(1)
    @Max(24)
    private Integer renewalMonths;
}

