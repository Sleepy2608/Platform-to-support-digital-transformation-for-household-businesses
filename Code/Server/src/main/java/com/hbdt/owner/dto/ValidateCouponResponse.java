package com.hbdt.owner.dto;

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
public class ValidateCouponResponse {

    private boolean valid;
    private String keyCode;
    private Integer discountPercent;
    private BigDecimal originalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
    private Integer remainingUses;
    private LocalDateTime expiresAt;
}

