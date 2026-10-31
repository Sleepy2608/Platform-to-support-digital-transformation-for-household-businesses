package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.common.service.OtpService;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.BypassKeyStatus;
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
class OwnerServiceBypassKeyTest {

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
    private BypassKeyRepository bypassKeyRepository;
    @Mock
    private BypassKeyUsageRepository bypassKeyUsageRepository;

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
                bypassKeyRepository,
                bypassKeyUsageRepository
        );
    }

    @Test
    @DisplayName("selectPackage với BypassKey hợp lệ: tiêu thụ 1 lượt, tạo usage, kích hoạt subscription 0đ")
    void testSelectPackageWithValidBypassKey() {
        String username = "owner_test";
        String keyCode = "8K2N9F7X1M4Q5Z8P3R9T";
        String inputKeyCode = "8k2n9f7x1m4q5z8p3r9t"; // chữ thường để test auto-uppercase

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

        BypassKey key = BypassKey.builder()
                .id(1L)
                .keyCode(keyCode)
                .maxUses(2)
                .usedCount(1)
                .discountPercent(100)
                .status(BypassKeyStatus.ACTIVE)
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
        when(bypassKeyRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));
        when(subscriptionRepository.findAllByBusinessIdOrderByCreatedAtDesc(50L)).thenReturn(List.of());
        when(subscriptionService.createPendingPaymentSubscription(eq(user), eq(plan), eq("YEARLY"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(createdSub);
        when(subscriptionService.createSubscriptionPayment(eq(999L), eq(BigDecimal.ZERO), eq("BYPASS_KEY")))
                .thenReturn(payment);

        OwnerProfileResponse res = ownerService.selectPackage(username, "VIP", "YEARLY", inputKeyCode);

        assertNotNull(res);
        // Verify key usedCount incremented to 2 and status changed to DEPLETED
        assertEquals(2, key.getUsedCount());
        assertEquals(BypassKeyStatus.DEPLETED, key.getStatus());
        verify(bypassKeyRepository).save(key);
        verify(bypassKeyUsageRepository).save(any(BypassKeyUsage.class));
        verify(subscriptionService).activateSubscription(999L);
        verify(subscriptionService).processPaymentCallback("TX-BYPASS-123", "COMPLETED");
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
    @DisplayName("selectPackage với BypassKey không tồn tại ném BadRequestException")
    void testSelectPackageWithNonExistentKey() {
        String username = "owner_test";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(bypassKeyRepository.findByKeyCodeForUpdate("00000000000000000000")).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", "00000000000000000000"));
        assertTrue(ex.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("selectPackage với BypassKey đã tạm khóa ném BadRequestException")
    void testSelectPackageWithDisabledKey() {
        String username = "owner_test";
        String keyCode = "12345678901234567890";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();
        BypassKey key = BypassKey.builder().keyCode(keyCode).status(BypassKeyStatus.DISABLED).maxUses(1).usedCount(0).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(bypassKeyRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", keyCode));
        assertTrue(ex.getMessage().contains("tạm khóa"));
    }

    @Test
    @DisplayName("selectPackage với BypassKey đã hết lượt ném BadRequestException")
    void testSelectPackageWithDepletedKey() {
        String username = "owner_test";
        String keyCode = "12345678901234567890";
        User user = createTestUser(username);
        SubscriptionPlan plan = SubscriptionPlan.builder().planCode("VIP").monthlyPrice(new BigDecimal("399000")).annualPrice(new BigDecimal("3990000")).status("ACTIVE").build();
        BypassKey key = BypassKey.builder().keyCode(keyCode).status(BypassKeyStatus.DEPLETED).maxUses(2).usedCount(2).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE")).thenReturn(Optional.of(plan));
        when(bypassKeyRepository.findByKeyCodeForUpdate(keyCode)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> ownerService.selectPackage(username, "VIP", "MONTHLY", keyCode));
        assertTrue(ex.getMessage().contains("hết số lượt sử dụng"));
    }
}

