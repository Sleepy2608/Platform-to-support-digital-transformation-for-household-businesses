package com.hbdt.admin.service;

import com.hbdt.admin.dto.bypasskey.BypassKeyCreateRequest;
import com.hbdt.admin.dto.bypasskey.BypassKeyResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeySummaryResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeyUsageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.BypassKey;
import com.hbdt.entity.BypassKeyUsage;
import com.hbdt.entity.enums.BypassKeyStatus;
import com.hbdt.repository.BypassKeyRepository;
import com.hbdt.repository.BypassKeyUsageRepository;
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
class BypassKeyAdminServiceTest {

    @Mock
    private BypassKeyRepository bypassKeyRepository;

    @Mock
    private BypassKeyUsageRepository bypassKeyUsageRepository;

    private BypassKeyAdminService bypassKeyAdminService;

    @BeforeEach
    void setUp() {
        bypassKeyAdminService = new BypassKeyAdminService(bypassKeyRepository, bypassKeyUsageRepository);
    }

    @Test
    @DisplayName("generateSecure20DigitCode sinh chuỗi 20 ký tự gồm đủ cả chữ số, chữ hoa và chữ thường")
    void testGenerateSecure20DigitCode() {
        when(bypassKeyRepository.existsByKeyCode(any())).thenReturn(false);

        String code = bypassKeyAdminService.generateSecure20DigitCode();

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
        when(bypassKeyRepository.existsByKeyCode(any())).thenReturn(false);
        when(bypassKeyRepository.save(any(BypassKey.class))).thenAnswer(inv -> {
            BypassKey key = inv.getArgument(0);
            key.setId(1L);
            key.setCreatedAt(LocalDateTime.now());
            key.setUpdatedAt(LocalDateTime.now());
            return key;
        });

        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode("")
                .maxUses(5)
                .note("Cấp thử nghiệm")
                .build();

        BypassKeyResponse response = bypassKeyAdminService.createKey(request, "admin");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(20, response.getKeyCode().length());
        assertEquals(5, response.getMaxUses());
        assertEquals(0, response.getUsedCount());
        assertEquals(100, response.getDiscountPercent());
        assertEquals(BypassKeyStatus.ACTIVE, response.getStatus());
        assertEquals("Cấp thử nghiệm", response.getNote());
        assertEquals("admin", response.getCreatedBy());
    }

    @Test
    @DisplayName("createKey chấp nhận mã 20 ký tự gồm cả chữ hoa, chữ thường và số do admin tự nhập")
    void testCreateKeyWithCustomValidCode() {
        String customCode = "8k2N9f7X1m4Q5Z8p3R9t";
        when(bypassKeyRepository.existsByKeyCode(customCode)).thenReturn(false);
        when(bypassKeyRepository.save(any(BypassKey.class))).thenAnswer(inv -> {
            BypassKey key = inv.getArgument(0);
            key.setId(2L);
            return key;
        });

        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode(customCode)
                .maxUses(1)
                .build();

        BypassKeyResponse response = bypassKeyAdminService.createKey(request, "superadmin");

        assertEquals(customCode, response.getKeyCode());
        assertEquals(1, response.getMaxUses());
    }

    @Test
    @DisplayName("createKey từ chối nếu mã tự nhập không đủ hoặc quá 20 ký tự chữ và số")
    void testCreateKeyRejectsInvalidLengthCode() {
        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode("123456789")
                .maxUses(1)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> bypassKeyAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("20 ký tự chữ và số"));
    }

    @Test
    @DisplayName("createKey từ chối nếu mã bị trùng lặp trong cơ sở dữ liệu")
    void testCreateKeyRejectsDuplicateCode() {
        String duplicateCode = "99999999999999999999";
        when(bypassKeyRepository.existsByKeyCode(duplicateCode)).thenReturn(true);

        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode(duplicateCode)
                .maxUses(2)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> bypassKeyAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("đã tồn tại"));
    }

    @Test
    @DisplayName("createKey tự động gán maxUses = 1 nếu giá trị đầu vào <= 0 hoặc null")
    void testCreateKeyDefaultsMaxUsesToOneWhenZeroOrNegative() {
        String customCode = "ABC123XYZ456DEF78901";
        when(bypassKeyRepository.existsByKeyCode(customCode)).thenReturn(false);
        when(bypassKeyRepository.save(any(BypassKey.class))).thenAnswer(inv -> {
            BypassKey key = inv.getArgument(0);
            key.setId(3L);
            return key;
        });

        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode(customCode)
                .maxUses(0)
                .build();

        BypassKeyResponse response = bypassKeyAdminService.createKey(request, "admin");
        assertNotNull(response);
        assertEquals(1, response.getMaxUses());

        request.setMaxUses(-5);
        BypassKeyResponse responseNeg = bypassKeyAdminService.createKey(request, "admin");
        assertNotNull(responseNeg);
        assertEquals(1, responseNeg.getMaxUses());
    }

    @Test
    @DisplayName("createKey từ chối nếu thời hạn hết hạn ở quá khứ")
    void testCreateKeyRejectsPastExpiry() {
        BypassKeyCreateRequest request = BypassKeyCreateRequest.builder()
                .keyCode("12345678901234567890")
                .maxUses(1)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> bypassKeyAdminService.createKey(request, "admin"));
        assertTrue(ex.getMessage().contains("tương lai"));
    }

    @Test
    @DisplayName("searchKeys phân trang và map dữ liệu chính xác")
    void testSearchKeys() {
        BypassKey key = BypassKey.builder()
                .id(10L)
                .keyCode("11112222333344445555")
                .maxUses(3)
                .usedCount(1)
                .status(BypassKeyStatus.ACTIVE)
                .build();

        when(bypassKeyRepository.searchBypassKeys(eq("1111"), eq(BypassKeyStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(key)));

        Page<BypassKeyResponse> result = bypassKeyAdminService.searchKeys("1111", BypassKeyStatus.ACTIVE, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("11112222333344445555", result.getContent().get(0).getKeyCode());
    }

    @Test
    @DisplayName("getSummary trả về đầy đủ các số liệu thống kê")
    void testGetSummary() {
        when(bypassKeyRepository.count()).thenReturn(15L);
        when(bypassKeyRepository.countByStatus(BypassKeyStatus.ACTIVE)).thenReturn(8L);
        when(bypassKeyRepository.countByStatus(BypassKeyStatus.DEPLETED)).thenReturn(4L);
        when(bypassKeyRepository.countByStatus(BypassKeyStatus.DISABLED)).thenReturn(2L);
        when(bypassKeyRepository.countByStatus(BypassKeyStatus.EXPIRED)).thenReturn(1L);
        when(bypassKeyRepository.sumTotalUsedCount()).thenReturn(25L);

        BypassKeySummaryResponse summary = bypassKeyAdminService.getSummary();

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
        BypassKey key = BypassKey.builder().id(5L).status(BypassKeyStatus.ACTIVE).build();
        when(bypassKeyRepository.findById(5L)).thenReturn(Optional.of(key));
        when(bypassKeyRepository.save(any(BypassKey.class))).thenAnswer(inv -> inv.getArgument(0));

        BypassKeyResponse response = bypassKeyAdminService.updateStatus(5L, BypassKeyStatus.DISABLED);

        assertEquals(BypassKeyStatus.DISABLED, response.getStatus());
    }

    @Test
    @DisplayName("deleteKey xóa thành công khi key chưa có lượt sử dụng nào")
    void testDeleteKeySuccessWhenUnused() {
        BypassKey key = BypassKey.builder().id(7L).usedCount(0).build();
        when(bypassKeyRepository.findById(7L)).thenReturn(Optional.of(key));
        when(bypassKeyUsageRepository.countByBypassKeyId(7L)).thenReturn(0L);

        bypassKeyAdminService.deleteKey(7L);

        verify(bypassKeyRepository).delete(key);
    }

    @Test
    @DisplayName("deleteKey ngăn chặn xóa khi key đã có lượt sử dụng thực tế")
    void testDeleteKeyFailsWhenAlreadyUsed() {
        BypassKey key = BypassKey.builder().id(8L).usedCount(2).build();
        when(bypassKeyRepository.findById(8L)).thenReturn(Optional.of(key));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> bypassKeyAdminService.deleteKey(8L));
        assertTrue(ex.getMessage().contains("Không thể xóa"));
        verify(bypassKeyRepository, never()).delete(any());
    }

    @Test
    @DisplayName("getKeyUsages trả về danh sách lịch sử sử dụng")
    void testGetKeyUsages() {
        when(bypassKeyRepository.existsById(9L)).thenReturn(true);
        BypassKeyUsage usage = BypassKeyUsage.builder()
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
        when(bypassKeyUsageRepository.findByBypassKeyIdOrderByUsedAtDesc(9L)).thenReturn(List.of(usage));

        List<BypassKeyUsageResponse> list = bypassKeyAdminService.getKeyUsages(9L);

        assertEquals(1, list.size());
        assertEquals("owner1", list.get(0).getUsername());
        assertEquals("VIP", list.get(0).getPackageType());
    }
}

