package com.hbdt.admin.service;

import com.hbdt.admin.dto.coupon.CouponCreateRequest;
import com.hbdt.admin.dto.coupon.CouponResponse;
import com.hbdt.admin.dto.coupon.CouponSummaryResponse;
import com.hbdt.admin.dto.coupon.CouponUsageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Coupon;
import com.hbdt.entity.CouponUsage;
import com.hbdt.entity.enums.CouponStatus;
import com.hbdt.repository.CouponRepository;
import com.hbdt.repository.CouponCheckoutRepository;
import com.hbdt.repository.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponManagementServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponUsageRepository couponUsageRepository;

    @Mock
    private CouponCheckoutRepository checkoutRepository;

    private CouponManagementService couponAdminService;

    @BeforeEach
    void setUp() {
        couponAdminService = new CouponManagementService(couponRepository, couponUsageRepository, checkoutRepository);
    }

    @Test
    @DisplayName("generateSecure20DigitCode sinh chuỗi 20 ký tự gồm đủ cả chữ số, chữ hoa và chữ thường")
    void testGenerateSecure20DigitCode() {
        when(couponRepository.existsByKeyCode(any())).thenReturn(false);

        String code = couponAdminService.generateSecure20DigitCode();

        assertNotNull(code);
        assertEquals(20, code.length());
        assertTrue(code.matches("^[a-zA-Z0-9]{20}$"));
        assertTrue(code.matches(".*[0-9].*"), "Mã phải chứa ít nhất 1 chữ số");
        assertTrue(code.matches(".*[A-Z].*"), "Mã phải chứa ít nhất 1 chữ hoa");
        assertTrue(code.matches(".*[a-z].*"), "Mã phải chứa ít nhất 1 chữ thường");
    }

    @Test
    @DisplayName("createKey tự động sinh mã khi keyCode để trống")
    void testCreateKeyAutoGeneratesCode() {
        when(couponRepository.existsByKeyCode(any())).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> {
            Coupon key = inv.getArgument(0);
            key.setId(1L);
            key.setCreatedAt(LocalDateTime.now());
            key.setUpdatedAt(LocalDateTime.now());
            return key;
        });

        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode("")
                .maxUses(5)
                .note("Cấp thử nghiệm")
                .build();

        CouponResponse response = couponAdminService.createKey(request, "admin");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(20, response.getKeyCode().length());
        assertEquals(5, response.getMaxUses());
        assertEquals(0, response.getUsedCount());
        assertEquals(25, response.getDiscountPercent());
        assertEquals(CouponStatus.ACTIVE, response.getStatus());
        assertEquals("Cấp thử nghiệm", response.getNote());
        assertEquals("admin", response.getCreatedBy());
    }

    @Test
    @DisplayName("createKey chấp nhận mã 20 ký tự gồm cả chữ hoa, chữ thường và số do admin tự nhập")
    void testCreateKeyWithCustomValidCode() {
        String customCode = "8k2N9f7X1m4Q5Z8p3R9t";
        when(couponRepository.existsByKeyCode(customCode)).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> {
            Coupon key = inv.getArgument(0);
            key.setId(2L);
            return key;
        });

        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode(customCode)
                .maxUses(1)
                .build();

        CouponResponse response = couponAdminService.createKey(request, "superadmin");

        assertEquals(customCode, response.getKeyCode());
        assertEquals(1, response.getMaxUses());
    }

    @Test
    @DisplayName("createKey từ chối nếu mã tự nhập không đủ hoặc quá 20 ký tự chữ và số")
    void testCreateKeyRejectsInvalidLengthCode() {
        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode("123456789")
                .maxUses(1)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> couponAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("20 ký tự chữ và số"));
    }

    @Test
    @DisplayName("createKey từ chối nếu mã bị trùng lặp trong cơ sở dữ liệu")
    void testCreateKeyRejectsDuplicateCode() {
        String duplicateCode = "99999999999999999999";
        when(couponRepository.existsByKeyCode(duplicateCode)).thenReturn(true);

        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode(duplicateCode)
                .maxUses(2)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> couponAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("createKey tự động gán maxUses = 1 nếu giá trị đầu vào <= 0 hoặc null")
    void testCreateKeyDefaultsMaxUsesToOneWhenZeroOrNegative() {
        String customCode = "ABC123XYZ456DEF78901";
        when(couponRepository.existsByKeyCode(customCode)).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> {
            Coupon key = inv.getArgument(0);
            key.setId(3L);
            return key;
        });

        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode(customCode)
                .maxUses(0)
                .build();

        CouponResponse response = couponAdminService.createKey(request, "admin");
        assertNotNull(response);
        assertEquals(1, response.getMaxUses());

        request.setMaxUses(-5);
        CouponResponse responseNeg = couponAdminService.createKey(request, "admin");
        assertNotNull(responseNeg);
        assertEquals(1, responseNeg.getMaxUses());
    }

    @Test
    @DisplayName("createKey từ chối nếu thời hạn hết hạn ở quá khứ")
    void testCreateKeyRejectsPastExpiry() {
        CouponCreateRequest request = CouponCreateRequest.builder().discountPercent(25)
                .keyCode("12345678901234567890")
                .maxUses(1)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> couponAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("tương lai"));
    }

    @Test
    @DisplayName("searchKeys phân trang và map dữ liệu chính xác")
    void testSearchKeys() {
        Coupon key = Coupon.builder()
                .id(10L)
                .keyCode("11112222333344445555")
                .maxUses(3)
                .usedCount(1)
                .status(CouponStatus.ACTIVE)
                .build();

        when(couponRepository.searchCoupons(eq("1111"), eq(CouponStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(key)));

        Page<CouponResponse> result = couponAdminService.searchKeys("1111", CouponStatus.ACTIVE, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("11112222333344445555", result.getContent().get(0).getKeyCode());
    }

    @Test
    @DisplayName("getSummary trả về đầy đủ các số liệu thống kê")
    void testGetSummary() {
        when(couponRepository.count()).thenReturn(15L);
        when(couponRepository.countByStatus(CouponStatus.ACTIVE)).thenReturn(8L);
        when(couponRepository.countByStatus(CouponStatus.DEPLETED)).thenReturn(4L);
        when(couponRepository.countByStatus(CouponStatus.DISABLED)).thenReturn(2L);
        when(couponRepository.countByStatus(CouponStatus.EXPIRED)).thenReturn(1L);
        when(couponRepository.sumTotalUsedCount()).thenReturn(25L);

        CouponSummaryResponse summary = couponAdminService.getSummary();

        assertEquals(15L, summary.getTotalKeys());
        assertEquals(8L, summary.getActiveKeys());
        assertEquals(4L, summary.getDepletedKeys());
        assertEquals(2L, summary.getDisabledKeys());
        assertEquals(1L, summary.getExpiredKeys());
        assertEquals(25L, summary.getTotalUsages());
    }

    @Test
    @DisplayName("updateStatus cập nhật trạng thái thành công")
    void testUpdateStatus() {
        Coupon key = Coupon.builder().id(5L).status(CouponStatus.ACTIVE).build();
        when(couponRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(key));
        when(couponRepository.save(any(Coupon.class))).thenAnswer(inv -> inv.getArgument(0));

        CouponResponse response = couponAdminService.updateStatus(5L, CouponStatus.DISABLED);

        assertEquals(CouponStatus.DISABLED, response.getStatus());
    }

    @Test
    @DisplayName("deleteKey xóa thành công khi key chưa có lượt sử dụng nào")
    void testDeleteKeySuccessWhenUnused() {
        Coupon key = Coupon.builder().id(7L).usedCount(0).build();
        when(couponRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(key));
        when(couponUsageRepository.countByCouponId(7L)).thenReturn(0L);

        couponAdminService.deleteKey(7L);

        verify(couponRepository).delete(key);
    }

    @Test
    @DisplayName("deleteKey ngăn chặn xóa khi key đã có lượt sử dụng thực tế")
    void testDeleteKeyFailsWhenAlreadyUsed() {
        Coupon key = Coupon.builder().id(8L).usedCount(2).build();
        when(couponRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> couponAdminService.deleteKey(8L));
        assertTrue(ex.getMessage().contains("Không thể xóa"));
        verify(couponRepository, never()).delete(any());
    }

    @Test
    @DisplayName("getKeyUsages trả về danh sách lịch sử sử dụng")
    void testGetKeyUsages() {
        when(couponRepository.existsById(9L)).thenReturn(true);
        CouponUsage usage = CouponUsage.builder()
                .id(100L)
                .userId(20L)
                .username("owner1")
                .businessId(1L)
                .packageType("VIP")
                .billingCycle("YEARLY")
                .originalAmount(new BigDecimal("3990000"))
                .discountAmount(new BigDecimal("3990000"))
                .finalAmount(BigDecimal.ZERO)
                .usedAt(LocalDateTime.now())
                .build();
        when(couponUsageRepository.findByCouponIdOrderByUsedAtDesc(9L)).thenReturn(List.of(usage));

        List<CouponUsageResponse> list = couponAdminService.getKeyUsages(9L);

        assertEquals(1, list.size());
        assertEquals("owner1", list.get(0).getUsername());
        assertEquals("VIP", list.get(0).getPackageType());
    }
}

