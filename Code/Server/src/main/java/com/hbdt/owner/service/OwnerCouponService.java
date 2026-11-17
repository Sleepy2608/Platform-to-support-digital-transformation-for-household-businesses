package com.hbdt.owner.service;

import com.hbdt.entity.Coupon;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.enums.CouponStatus;
import com.hbdt.owner.dto.ValidateCouponRequest;
import com.hbdt.owner.dto.ValidateCouponResponse;
import com.hbdt.repository.CouponRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class OwnerCouponService {

    private final CouponRepository couponRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public OwnerCouponService(CouponRepository couponRepository,
                                 SubscriptionPlanRepository subscriptionPlanRepository) {
        this.couponRepository = couponRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    /**
     * Xác thực mã giảm giá do chủ hộ kinh doanh (Owner) nhập vào khi thanh toán gói cước.
     */
    public ValidateCouponResponse validateKey(ValidateCouponRequest request) {
        String keyCode = request.getKeyCode() != null ? request.getKeyCode().trim() : "";

        if (keyCode.isEmpty()) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .message("Vui lòng nhập mã giảm giá")
                    .build();
        }

        if (!keyCode.matches("^[a-zA-Z0-9]{20}$")) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá phải gồm chính xác 20 ký tự chữ và số")
                    .build();
        }

        Optional<Coupon> keyOpt = couponRepository.findByKeyCode(keyCode);
        if (keyOpt.isEmpty()) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá không tồn tại hoặc không chính xác")
                    .build();
        }

        Coupon key = keyOpt.get();

        if (key.getStatus() == CouponStatus.DISABLED) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá này hiện đang bị tạm khóa bởi quản trị viên")
                    .build();
        }

        if (key.getStatus() == CouponStatus.DEPLETED ||
                (key.getMaxUses() != null && key.getUsedCount() != null && key.getUsedCount() >= key.getMaxUses())) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá này đã sử dụng hết số lượt cho phép (" + key.getMaxUses() + " lượt)")
                    .build();
        }

        if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá này đã hết hạn sử dụng vào ngày " + key.getExpiresAt())
                    .build();
        }

        if (key.getStatus() != CouponStatus.ACTIVE) {
            return ValidateCouponResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã giảm giá hiện không khả dụng (Trạng thái: " + key.getStatus().getDescription() + ")")
                    .build();
        }

        // Tính toán số tiền dựa trên gói dịch vụ được chọn (nếu có)
        BigDecimal originalAmount = BigDecimal.ZERO;
        if (request.getPackageType() != null && !request.getPackageType().isBlank()) {
            Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository
                    .findByPlanCodeIgnoreCaseAndStatus(request.getPackageType().trim(), "ACTIVE");
            if (planOpt.isPresent()) {
                SubscriptionPlan plan = planOpt.get();
                boolean isYearly = "YEARLY".equalsIgnoreCase(request.getBillingCycle());
                originalAmount = isYearly ? plan.getAnnualPrice() : plan.getMonthlyPrice();
                if (request.getRenewalMonths() != null) {
                    originalAmount = plan.getMonthlyPrice().multiply(BigDecimal.valueOf(request.getRenewalMonths()));
                }
            }
        }

        int remaining = Math.max(0, key.getMaxUses() - key.getUsedCount());

        BigDecimal discount = key.discountAmount(originalAmount);
        return ValidateCouponResponse.builder()
                .valid(true)
                .keyCode(key.getKeyCode())
                .discountPercent(key.getDiscountPercent())
                .originalAmount(originalAmount)
                .discountAmount(discount)
                .finalAmount(originalAmount.subtract(discount))
                .message("Áp dụng mã giảm giá thành công!")
                .remainingUses(remaining)
                .expiresAt(key.getExpiresAt())
                .build();
    }
}

