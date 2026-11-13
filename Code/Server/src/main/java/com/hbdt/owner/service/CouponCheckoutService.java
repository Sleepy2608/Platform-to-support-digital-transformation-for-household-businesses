package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Coupon;
import com.hbdt.entity.CouponCheckout;
import com.hbdt.entity.Subscription;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.CouponCheckoutResponse;
import com.hbdt.owner.dto.ValidateCouponRequest;
import com.hbdt.repository.CouponCheckoutRepository;
import com.hbdt.repository.CouponRepository;
import com.hbdt.repository.PaymentHistoryRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import com.hbdt.repository.SubscriptionRepository;
import com.hbdt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponCheckoutService {
    private final CouponCheckoutRepository checkoutRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final OwnerService ownerService;

    public CouponCheckoutResponse create(String username, ValidateCouponRequest request) {
        User user = findOwner(username);
        Coupon coupon = couponRepository.findByKeyCodeForUpdate(request.getKeyCode().trim())
                .orElseThrow(() -> new BadRequestException("Mã giảm giá không tồn tại"));
        if (!coupon.isUsable()) {
            throw new BadRequestException("Mã giảm giá không còn khả dụng");
        }

        Integer renewalMonths = request.getRenewalMonths();
        Long subscriptionId = null;
        String billingCycle;
        SubscriptionPlan plan;
        BigDecimal originalAmount;
        if (renewalMonths != null) {
            Subscription subscription = subscriptionRepository.findTopByBusinessIdAndStatusOrderByCreatedAtDesc(
                    user.getBusinessId(), SubscriptionStatus.ACTIVE)
                    .orElseThrow(() -> new BadRequestException("Chưa có gói dịch vụ đang hoạt động"));
            subscriptionId = subscription.getId();
            plan = subscription.getPlan();
            billingCycle = "MONTHLY";
            originalAmount = plan.getMonthlyPrice().multiply(BigDecimal.valueOf(renewalMonths));
        } else {
            billingCycle = request.getBillingCycle();
            if (!"MONTHLY".equals(billingCycle) && !"YEARLY".equals(billingCycle)) {
                throw new BadRequestException("Chu kỳ thanh toán không hợp lệ");
            }
            if (request.getPackageType() == null || request.getPackageType().isBlank()) {
                throw new BadRequestException("Vui lòng chọn gói dịch vụ");
            }
            plan = planRepository.findByPlanCodeIgnoreCaseAndStatus(request.getPackageType().trim(), "ACTIVE")
                    .orElseThrow(() -> new BadRequestException("Gói thuê bao không còn khả dụng"));
            originalAmount = "YEARLY".equals(billingCycle) ? plan.getAnnualPrice() : plan.getMonthlyPrice();
        }

        BigDecimal finalAmount = originalAmount.subtract(coupon.discountAmount(originalAmount));
        if (finalAmount.signum() <= 0) {
            throw new BadRequestException("Khoản thanh toán này có thể kích hoạt trực tiếp");
        }
        LocalDateTime now = LocalDateTime.now();
        List<CouponCheckout> reservations = checkoutRepository.findReservations(coupon.getId(), now);
        for (CouponCheckout checkout : reservations) {
            if (user.getId().equals(checkout.getUserId()) && user.getBusinessId().equals(checkout.getBusinessId())
                    && plan.getPlanCode().equals(checkout.getPlanCode()) && billingCycle.equals(checkout.getBillingCycle())
                    && Objects.equals(renewalMonths, checkout.getRenewalMonths())
                    && Objects.equals(subscriptionId, checkout.getSubscriptionId())
                    && originalAmount.compareTo(checkout.getOriginalAmount()) == 0) {
                return CouponCheckoutResponse.from(checkout, now);
            }
        }
        if (reservations.size() >= coupon.getMaxUses() - coupon.getUsedCount()) {
            throw new BadRequestException("Các lượt còn lại của mã giảm giá đang chờ thanh toán");
        }

        LocalDateTime expiresAt = now.plusMinutes(30);
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(expiresAt)) {
            expiresAt = coupon.getExpiresAt();
        }
        String reference = "HBDTCP" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 16).toUpperCase(Locale.ROOT);
        CouponCheckout checkout = checkoutRepository.save(CouponCheckout.builder()
                .reference(reference)
                .couponId(coupon.getId())
                .userId(user.getId())
                .businessId(user.getBusinessId())
                .planCode(plan.getPlanCode())
                .billingCycle(billingCycle)
                .renewalMonths(renewalMonths)
                .subscriptionId(subscriptionId)
                .originalAmount(originalAmount)
                .finalAmount(finalAmount)
                .expiresAt(expiresAt)
                .build());
        return CouponCheckoutResponse.from(checkout, now);
    }

    @Transactional(readOnly = true)
    public CouponCheckoutResponse status(String username, String reference) {
        User user = findOwner(username);
        return checkoutRepository.findByReferenceAndUserId(reference, user.getId())
                .filter(checkout -> user.getBusinessId().equals(checkout.getBusinessId()))
                .map(checkout -> CouponCheckoutResponse.from(checkout, LocalDateTime.now()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch mã giảm giá"));
    }

    public boolean confirm(String reference, BigDecimal transferredAmount, String transactionId) {
        Long couponId = checkoutRepository.findCouponId(reference).orElse(null);
        if (couponId == null) {
            return false;
        }
        Coupon coupon = couponRepository.findByIdForUpdate(couponId).orElse(null);
        CouponCheckout checkout = checkoutRepository.findByReferenceForUpdate(reference).orElseThrow();
        if (paymentHistoryRepository.findByTransactionId(transactionId).isPresent()) {
            return true;
        }
        LocalDateTime now = LocalDateTime.now();
        if (coupon == null || checkout.getPaidAt() != null || !checkout.getExpiresAt().isAfter(now)
                || transferredAmount == null || transferredAmount.compareTo(checkout.getFinalAmount()) != 0) {
            return false;
        }

        ownerService.completeCouponCheckout(checkout, coupon, transactionId);
        checkout.setPaidAt(now);
        return true;
    }

    private User findOwner(String username) {
        return userRepository.findByUsername(username)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE && user.getBusinessId() != null)
                .orElseThrow(() -> new BadRequestException("Tài khoản chưa có hồ sơ hộ kinh doanh đang hoạt động"));
    }
}
