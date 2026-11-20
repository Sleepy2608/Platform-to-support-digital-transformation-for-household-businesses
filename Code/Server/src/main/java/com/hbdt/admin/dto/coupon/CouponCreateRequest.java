package com.hbdt.admin.dto.coupon;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponCreateRequest {

    /**
     * Mã giảm giá gồm 20 ký tự chữ và số.
     * Nếu để trống, hệ thống sẽ tự động sinh 20 ký tự ngẫu nhiên an toàn.
     */
    @Pattern(regexp = "^$|^[a-zA-Z0-9]{20}$", message = "Mã giảm giá nếu tự đặt phải gồm đúng 20 ký tự chữ và số")
    private String keyCode;

    @NotNull(message = "Phần trăm giảm giá không được để trống")
    @Min(value = 1, message = "Phần trăm giảm giá tối thiểu là 1")
    @Max(value = 100, message = "Phần trăm giảm giá tối đa là 100")
    private Integer discountPercent;

    private Integer maxUses;

    public Integer getMaxUses() {
        if (maxUses == null || maxUses <= 0) {
            return 1;
        }
        return maxUses;
    }

    @Size(max = 255, message = "Ghi chú không được quá 255 ký tự")
    private String note;

    private LocalDateTime expiresAt;
}

