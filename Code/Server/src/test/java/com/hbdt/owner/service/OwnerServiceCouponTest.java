package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.common.service.OtpService;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.CouponStatus;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.OwnerProfileResponse;
import com.hbdt.repository.*;
import com.hbdt.subscription.service.ISubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnerServiceCouponTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private OtpService otpService;
    @Mock
    private ImageStorageService imageStorageService;
    @Mock
    private PaymentHistoryRepository paymentHistoryRepository;
    @Mock
    private ServiceInvoiceRepository serviceInvoiceRepository;
    @Mock
    private SubscriptionHistoryRepository subscriptionHistoryRepository;
    @Mock
    private ISubscriptionService subscriptionService;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private CouponUsageRepository couponUsageRepository;

    @Mock
    private CouponCheckoutRepository couponCheckoutRepository;
    @Mock
    private BusinessProfileRepository businessProfileRepository;

    private OwnerService ownerService;

    @BeforeEach
    void setUp() {
        ownerService = new OwnerService(
                userRepository,
                subscriptionRepository,
                subscriptionPlanRepository,
                passwordEncoder,
                otpService,
                imageStorageService,
                paymentHistoryRepository,
                serviceInvoiceRepository,
                subscriptionHistoryRepository,
                subscriptionService,
                couponRepository,
                couponUsageRepository,
                couponCheckoutRepository,
                businessProfileRepository
        );
    }

    @Test
    @DisplayName("selectPackage với Coupon hợp lệ: tiêu thụ 1 lượt, tạo usage, kích hoạt subscription 0đ")
    void testSelectPackageWithValidCoupon() {
        String username = "owner_test";
        String keyCode = "8k2N9f7X1m4Q5Z8p3R9t";
        String inputKeyCode = "8k2N9f7X1m4Q5Z8p3R9t";

        User user = User.builder()
                .id(100L)
                .username(username)
                .businessId(50L)
                .status(UserStatus.ACTIVE)
                .role(Role.builder().id(1L).name(RoleType.BUSINESS_OWNER).build())
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .id(2L)
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .annualPrice(new BigDecimal("3990000"))
                .status("ACTIVE")
                .build();

        Coupon key = Coupon.builder().discountPercent(100)
                .id(1L)
                .keyCode(keyCode)
                .maxUses(2)
                .usedCount(1)
                .status(CouponStatus.ACTIVE)
                .build();

        Subscription createdSub = Subscription.builder()
                .id(999L)
                .businessId(50L)
                .plan(plan)
                .status(SubscriptionStatus.PENDING_PAYMENT)
                .build();

        PaymentHistory payment = PaymentHistory.builder()
                .id(55L)
                .transactionId("TX-BYPASS-123")
                .amount(BigDecimal.ZERO)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(couponRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));
        when(businessProfileRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(new BusinessProfile()));
        when(subscriptionRepository.findAllByBusinessIdOrderByCreatedAtDesc(50L)).thenReturn(List.of());
        when(subscriptionService.createPendingPaymentSubscription(eq(user), eq(plan), eq("YEARLY"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createdSub);

        OwnerProfileResponse res = ownerService.selectPackage(username, "VIP", "YEARLY", inputKeyCode);

        assertNotNull(res);
        // Verify key usedCount incremented to 2 and status changed to DEPLETED
        assertEquals(2, key.getUsedCount());
        assertEquals(CouponStatus.DEPLETED, key.getStatus());
        verify(couponRepository).save(key);
        verify(couponUsageRepository).save(any(CouponUsage.class));
        verify(subscriptionService).activateSubscription(999L);
    }

    private User createTestUser(String username) {
        return User.builder()
                .id(100L)
                .username(username)
                .businessId(50L)
                .status(UserStatus.ACTIVE)
                .role(Role.builder().id(1L).name(RoleType.BUSINESS_OWNER).build())
                .build();
    }

    @Test
    @DisplayName("selectPackage với Coupon không tồn tại ném BadRequestException")
    void testSelectPackageWithNonExistentKey() {
        String username = "owner_test";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(couponRepository.findByKeyCodeForUpdate("00000000000000000000")).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", "00000000000000000000"));
        assertTrue(ex.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("selectPackage với Coupon đã tạm khóa ném BadRequestException")
    void testSelectPackageWithDisabledKey() {
        String username = "owner_test";
        String keyCode = "12345678901234567890";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();
        Coupon key = Coupon.builder().discountPercent(100).keyCode(keyCode).status(CouponStatus.DISABLED).maxUses(1).usedCount(0).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(couponRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", keyCode));
        assertTrue(ex.getMessage().contains("tạm khóa"));
    }

    @Test
    @DisplayName("selectPackage với Coupon đã hết lượt ném BadRequestException")
    void testSelectPackageWithDepletedKey() {
        String username = "owner_test";
        String keyCode = "12345678901234567890";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();
        Coupon key = Coupon.builder().discountPercent(100).keyCode(keyCode).status(CouponStatus.DEPLETED).maxUses(2).usedCount(2).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(couponRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", keyCode));
        assertTrue(ex.getMessage().contains("hết số lượt sử dụng"));
    }

    @Test
    @DisplayName("selectPackage khi số tiền > 0 và không có Coupon ném BadRequestException báo thanh toán không thành công")
    void testSelectPackageWithoutCouponRejectsPayment() {
        String username = "owner_test";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .annualPrice(new BigDecimal("3990000"))
                .status("ACTIVE")
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));

        when(businessProfileRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(new BusinessProfile()));
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", null));
        assertTrue(ex.getMessage().contains("Thanh toán không thành công"));
    }

    @Test
    @DisplayName("renewSubscription khi số tiền > 0 và không có Coupon ném BadRequestException báo thanh toán không thành công")
    void testRenewSubscriptionWithoutCouponRejectsPayment() {
        String username = "owner_test";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .status("ACTIVE")
                .build();
        Subscription activeSub = Subscription.builder()
                .id(88L)
                .businessId(50L)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .endDate(LocalDate.now().plusMonths(1))
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(businessProfileRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(new BusinessProfile()));
        when(subscriptionRepository.findTopByBusinessIdAndStatusOrderByCreatedAtDesc(50L, SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeSub));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.renewSubscription(username, 1, null));
        assertTrue(ex.getMessage().contains("Thanh toán không thành công"));
    }

    @Test
    @DisplayName("renewSubscription với Coupon hợp lệ: trừ 1 lượt, gia hạn thêm tháng và miễn phí 0đ")
    void testRenewSubscriptionWithValidCoupon() {
        String username = "owner_test";
        String keyCode = "8k2N9f7X1m4Q5Z8p3R9t";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .status("ACTIVE")
                .build();
        LocalDate initialEnd = LocalDate.now().plusMonths(2);
        Subscription activeSub = Subscription.builder()
                .id(88L)
                .businessId(50L)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .endDate(initialEnd)
                .build();

        Coupon key = Coupon.builder().discountPercent(100)
                .id(10L)
                .keyCode(keyCode)
                .maxUses(5)
                .usedCount(1)
                .status(CouponStatus.ACTIVE)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(businessProfileRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(new BusinessProfile()));
        when(subscriptionRepository.findTopByBusinessIdAndStatusOrderByCreatedAtDesc(50L, SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeSub));
        when(couponRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));

        OwnerProfileResponse res = ownerService.renewSubscription(username, 3, keyCode);

        assertNotNull(res);
        assertEquals(2, key.getUsedCount());
        assertEquals(initialEnd.plusMonths(3), activeSub.getEndDate());
        verify(couponUsageRepository).save(any(CouponUsage.class));
        verify(paymentHistoryRepository).save(any(PaymentHistory.class));
    }
}

