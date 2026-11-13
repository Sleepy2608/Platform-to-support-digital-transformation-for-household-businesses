package com.hbdt.admin.dto.coupon;

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
public class CouponSummaryResponse {

    private long totalKeys;
    private long activeKeys;
    private long depletedKeys;
    private long disabledKeys;
    private long expiredKeys;
    private long totalUsages;
}

