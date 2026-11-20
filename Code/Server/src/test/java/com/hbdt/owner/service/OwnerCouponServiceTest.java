package com.hbdt.owner.service;

import com.hbdt.entity.Coupon;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.enums.CouponStatus;
import com.hbdt.owner.dto.ValidateCouponRequest;
import com.hbdt.owner.dto.ValidateCouponResponse;
import com.hbdt.repository.CouponRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerCouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    private OwnerCouponService ownerCouponService;

    @BeforeEach
    void setUp() {
        ownerCouponService = new OwnerCouponService(couponRepository, subscriptionPlanRepository);
    }

    @Test
    @DisplayName("validateKey thành công khi mã chữ và số hợp lệ (có chữ hoa, thường và số), còn lượt dùng, tính đúng số tiền 0đ")
    void testValidateKeySuccess() {
        String code = "8k2N9f7X1m4Q5Z8p3R9t";
        Coupon key = Coupon.builder().discountPercent(100)
                .id(1L)
                .keyCode(code)
                .maxUses(5)
                .usedCount(2)
                .status(CouponStatus.ACTIVE)
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .annualPrice(new BigDecimal("3990000"))
                .status("ACTIVE")
                .build();

        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.of(key));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE"))
                .thenReturn(Optional.of(plan));

        ValidateCouponRequest request = ValidateCouponRequest.builder()
                .keyCode(code)
                .packageType("VIP")
                .billingCycle("YEARLY")
                .build();

        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertTrue(res.isValid());
        assertEquals(code, res.getKeyCode());
        assertEquals(100, res.getDiscountPercent());
        assertEquals(new BigDecimal("3990000"), res.getOriginalAmount());
        assertEquals(new BigDecimal("3990000"), res.getDiscountAmount());
        assertEquals(BigDecimal.ZERO, res.getFinalAmount());
        assertEquals(3, res.getRemainingUses());
    }

    @Test
    void quotesPartialDiscountOnAllRenewalMonths() {
        String code = "8k2N9f7X1m4Q5Z8p3R9t";
        Coupon coupon = Coupon.builder().keyCode(code).maxUses(3).discountPercent(25).build();
        SubscriptionPlan plan = SubscriptionPlan.builder().monthlyPrice(new BigDecimal("399000")).build();
        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.of(coupon));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE"))
                .thenReturn(Optional.of(plan));

        ValidateCouponResponse result = ownerCouponService.validateKey(ValidateCouponRequest.builder()
                .keyCode(code).packageType("VIP").billingCycle("MONTHLY").renewalMonths(3).build());

        assertEquals(new BigDecimal("1197000"), result.getOriginalAmount());
        assertEquals(new BigDecimal("299250"), result.getDiscountAmount());
        assertEquals(new BigDecimal("897750"), result.getFinalAmount());
    }

    @Test
    @DisplayName("validateKey thất bại khi keyCode để trống hoặc null")
    void testValidateKeyBlank() {
        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode("   ").build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("không được để trống") || res.getMessage().contains("Vui lòng nhập"));
    }

    @Test
    @DisplayName("validateKey thất bại khi keyCode không đủ 20 ký tự chữ và số")
    void testValidateKeyInvalidLength() {
        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode("12345").build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("20 ký tự chữ và số"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã không tồn tại trong hệ thống")
    void testValidateKeyNotFound() {
        String code = "99999999999999999999";
        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.empty());

        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode(code).build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đang bị tạm khóa (DISABLED)")
    void testValidateKeyDisabled() {
        String code = "12345678901234567890";
        Coupon key = Coupon.builder().discountPercent(100)
                .keyCode(code)
                .maxUses(5)
                .usedCount(1)
                .status(CouponStatus.DISABLED)
                .build();
        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode(code).build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("tạm khóa"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đã hết số lượt dùng (DEPLETED)")
    void testValidateKeyDepleted() {
        String code = "12345678901234567890";
        Coupon key = Coupon.builder().discountPercent(100)
                .keyCode(code)
                .maxUses(3)
                .usedCount(3)
                .status(CouponStatus.DEPLETED)
                .build();
        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode(code).build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("hết số lượt cho phép"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đã quá hạn sử dụng (EXPIRED)")
    void testValidateKeyExpired() {
        String code = "12345678901234567890";
        Coupon key = Coupon.builder().discountPercent(100)
                .keyCode(code)
                .maxUses(5)
                .usedCount(1)
                .status(CouponStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusHours(2))
                .build();
        when(couponRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateCouponRequest request = ValidateCouponRequest.builder().keyCode(code).build();
        ValidateCouponResponse res = ownerCouponService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("hết hạn sử dụng"));
    }
}

