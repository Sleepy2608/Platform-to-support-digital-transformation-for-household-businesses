package com.hbdt.owner.service;

import com.hbdt.entity.BypassKey;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.enums.BypassKeyStatus;
import com.hbdt.owner.dto.ValidateBypassKeyRequest;
import com.hbdt.owner.dto.ValidateBypassKeyResponse;
import com.hbdt.repository.BypassKeyRepository;
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
class OwnerBypassKeyServiceTest {

    @Mock
    private BypassKeyRepository bypassKeyRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    private OwnerBypassKeyService ownerBypassKeyService;

    @BeforeEach
    void setUp() {
        ownerBypassKeyService = new OwnerBypassKeyService(bypassKeyRepository, subscriptionPlanRepository);
    }

    @Test
    @DisplayName("validateKey thành công khi mã chữ và số hợp lệ (có chữ hoa, thường và số), còn lượt dùng, tính đúng số tiền 0đ")
    void testValidateKeySuccess() {
        String code = "8k2N9f7X1m4Q5Z8p3R9t";
        BypassKey key = BypassKey.builder()
                .id(1L)
                .keyCode(code)
                .maxUses(5)
                .usedCount(2)
                .status(BypassKeyStatus.ACTIVE)
                .build();

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planCode("VIP")
                .monthlyPrice(new BigDecimal("399000"))
                .annualPrice(new BigDecimal("3990000"))
                .status("ACTIVE")
                .build();

        when(bypassKeyRepository.findByKeyCode(code)).thenReturn(Optional.of(key));
        when(subscriptionPlanRepository.findByPlanCodeIgnoreCaseAndStatus("VIP", "ACTIVE"))
                .thenReturn(Optional.of(plan));

        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder()
                .keyCode(code)
                .packageType("VIP")
                .billingCycle("YEARLY")
                .build();

        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertTrue(res.isValid());
        assertEquals(code, res.getKeyCode());
        assertEquals(100, res.getDiscountPercent());
        assertEquals(new BigDecimal("3990000"), res.getOriginalAmount());
        assertEquals(new BigDecimal("3990000"), res.getDiscountAmount());
        assertEquals(BigDecimal.ZERO, res.getFinalAmount());
        assertEquals(3, res.getRemainingUses());
    }

    @Test
    @DisplayName("validateKey thất bại khi keyCode để trống hoặc null")
    void testValidateKeyBlank() {
        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode("   ").build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("không được để trống") || res.getMessage().contains("Vui lòng nhập"));
    }

    @Test
    @DisplayName("validateKey thất bại khi keyCode không đủ 20 ký tự chữ và số")
    void testValidateKeyInvalidLength() {
        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode("12345").build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("20 ký tự chữ và số"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã không tồn tại trong hệ thống")
    void testValidateKeyNotFound() {
        String code = "99999999999999999999";
        when(bypassKeyRepository.findByKeyCode(code)).thenReturn(Optional.empty());

        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode(code).build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("không tồn tại"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đang bị tạm khóa (DISABLED)")
    void testValidateKeyDisabled() {
        String code = "12345678901234567890";
        BypassKey key = BypassKey.builder()
                .keyCode(code)
                .maxUses(5)
                .usedCount(1)
                .status(BypassKeyStatus.DISABLED)
                .build();
        when(bypassKeyRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode(code).build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("tạm khóa"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đã hết số lượt dùng (DEPLETED)")
    void testValidateKeyDepleted() {
        String code = "12345678901234567890";
        BypassKey key = BypassKey.builder()
                .keyCode(code)
                .maxUses(3)
                .usedCount(3)
                .status(BypassKeyStatus.DEPLETED)
                .build();
        when(bypassKeyRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode(code).build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("hết số lượt cho phép"));
    }

    @Test
    @DisplayName("validateKey thất bại khi mã đã quá hạn sử dụng (EXPIRED)")
    void testValidateKeyExpired() {
        String code = "12345678901234567890";
        BypassKey key = BypassKey.builder()
                .keyCode(code)
                .maxUses(5)
                .usedCount(1)
                .status(BypassKeyStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusHours(2))
                .build();
        when(bypassKeyRepository.findByKeyCode(code)).thenReturn(Optional.of(key));

        ValidateBypassKeyRequest request = ValidateBypassKeyRequest.builder().keyCode(code).build();
        ValidateBypassKeyResponse res = ownerBypassKeyService.validateKey(request);

        assertFalse(res.isValid());
        assertTrue(res.getMessage().contains("hết hạn sử dụng"));
    }
}

