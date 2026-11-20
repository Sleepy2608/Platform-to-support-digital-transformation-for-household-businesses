package com.hbdt.admin.dto.coupon;

import com.hbdt.entity.enums.CouponStatus;
import jakarta.validation.constraints.NotNull;
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
public class CouponStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private CouponStatus status;
}

