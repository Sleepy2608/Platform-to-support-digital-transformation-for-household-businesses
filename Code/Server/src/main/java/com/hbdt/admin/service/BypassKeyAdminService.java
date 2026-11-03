package com.hbdt.admin.service;

import com.hbdt.admin.dto.bypasskey.BypassKeyCreateRequest;
import com.hbdt.admin.dto.bypasskey.BypassKeyResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeySummaryResponse;
import com.hbdt.admin.dto.bypasskey.BypassKeyUsageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.BypassKey;
import com.hbdt.entity.enums.BypassKeyStatus;
import com.hbdt.repository.BypassKeyRepository;
import com.hbdt.repository.BypassKeyUsageRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BypassKeyAdminService {

    private final BypassKeyRepository bypassKeyRepository;
    private final BypassKeyUsageRepository bypassKeyUsageRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private static final String DIGITS = "0123456789";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String ALL_CHARS = DIGITS + UPPERCASE + LOWERCASE;

    public BypassKeyAdminService(BypassKeyRepository bypassKeyRepository,
                                 BypassKeyUsageRepository bypassKeyUsageRepository) {
        this.bypassKeyRepository = bypassKeyRepository;
        this.bypassKeyUsageRepository = bypassKeyUsageRepository;
    }

    /**
     * Sinh ngẫu nhiên mã Bypass Key gồm chính xác 20 ký tự (chữ hoa A-Z, chữ thường a-z và số 0-9) bảo mật cao.
     * Đảm bảo luôn có sự xuất hiện của cả chữ số, chữ hoa và chữ thường.
     * Kiểm tra chống trùng lặp trong cơ sở dữ liệu.
     */
    public String generateSecure20DigitCode() {
        int maxAttempts = 10;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            char[] codeChars = new char[20];
            // Đảm bảo có ít nhất 1 chữ số, 1 chữ hoa, 1 chữ thường
            codeChars[0] = DIGITS.charAt(secureRandom.nextInt(DIGITS.length()));
            codeChars[1] = UPPERCASE.charAt(secureRandom.nextInt(UPPERCASE.length()));
            codeChars[2] = LOWERCASE.charAt(secureRandom.nextInt(LOWERCASE.length()));

            for (int i = 3; i < 20; i++) {
                codeChars[i] = ALL_CHARS.charAt(secureRandom.nextInt(ALL_CHARS.length()));
            }

            // Trộn ngẫu nhiên (Fisher-Yates shuffle) các vị trí
            for (int i = codeChars.length - 1; i > 0; i--) {
                int j = secureRandom.nextInt(i + 1);
                char temp = codeChars[i];
                codeChars[i] = codeChars[j];
                codeChars[j] = temp;
            }

            String candidate = new String(codeChars);
            if (!bypassKeyRepository.existsByKeyCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Không thể sinh mã Bypass Key duy nhất sau nhiều lần thử, vui lòng thử lại.");
    }

    /**
     * Tạo Bypass Key mới (Admin).
     */
    public BypassKeyResponse createKey(BypassKeyCreateRequest request, String adminUsername) {
        String keyCode = request.getKeyCode() != null ? request.getKeyCode().trim() : "";

        if (keyCode.isEmpty()) {
            keyCode = generateSecure20DigitCode();
        } else {
            if (!keyCode.matches("^[a-zA-Z0-9]{20}$")) {
                throw new BadRequestException("Mã Bypass Key phải gồm đúng 20 ký tự chữ và số (0-9, a-z, A-Z)");
            }
            if (bypassKeyRepository.existsByKeyCode(keyCode)) {
                throw new BadRequestException("Mã Bypass Key " + keyCode + " đã tồn tại trên hệ thống");
            }
        }

        // Nếu số lần dùng <= 0 hoặc để trống thì mặc định tính là 1
        int maxUses = (request.getMaxUses() == null || request.getMaxUses() <= 0) ? 1 : request.getMaxUses();

        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Thời gian hết hạn phải ở tương lai");
        }

        BypassKey bypassKey = BypassKey.builder()
                .keyCode(keyCode)
                .maxUses(maxUses)
                .usedCount(0)
                .discountPercent(100)
                .status(BypassKeyStatus.ACTIVE)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .expiresAt(request.getExpiresAt())
                .createdBy(adminUsername != null ? adminUsername : "admin")
                .build();

        BypassKey saved = bypassKeyRepository.save(bypassKey);
        return BypassKeyResponse.fromEntity(saved);
    }

    /**
     * Tìm kiếm và phân trang danh sách Bypass Key.
     */
    @Transactional(readOnly = true)
    public Page<BypassKeyResponse> searchKeys(String keyword, BypassKeyStatus status, int page, int size) {
        String trimmedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<BypassKey> keyPage = bypassKeyRepository.searchBypassKeys(trimmedKeyword, status, pageable);
        return keyPage.map(BypassKeyResponse::fromEntity);
    }

    /**
     * Lấy thông tin chi tiết một Bypass Key theo ID.
     */
    @Transactional(readOnly = true)
    public BypassKeyResponse getKeyById(Long id) {
        BypassKey key = bypassKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Bypass Key với id: " + id));
        return BypassKeyResponse.fromEntity(key);
    }

    /**
     * Lấy dữ liệu tổng hợp số liệu thống kê Bypass Key cho Admin.
     */
    @Transactional(readOnly = true)
    public BypassKeySummaryResponse getSummary() {
        long total = bypassKeyRepository.count();
        long active = bypassKeyRepository.countByStatus(BypassKeyStatus.ACTIVE);
        long depleted = bypassKeyRepository.countByStatus(BypassKeyStatus.DEPLETED);
        long disabled = bypassKeyRepository.countByStatus(BypassKeyStatus.DISABLED);
        long expired = bypassKeyRepository.countByStatus(BypassKeyStatus.EXPIRED);
        long totalUsages = bypassKeyRepository.sumTotalUsedCount();

        return BypassKeySummaryResponse.builder()
                .totalKeys(total)
                .activeKeys(active)
                .depletedKeys(depleted)
                .disabledKeys(disabled)
                .expiredKeys(expired)
                .totalUsages(totalUsages)
                .build();
    }

    /**
     * Cập nhật trạng thái của Bypass Key (Bật/Tắt).
     */
    public BypassKeyResponse updateStatus(Long id, BypassKeyStatus newStatus) {
        if (newStatus == null) {
            throw new BadRequestException("Trạng thái mới không được để trống");
        }

        BypassKey key = bypassKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Bypass Key với id: " + id));

        key.setStatus(newStatus);
        BypassKey updated = bypassKeyRepository.save(key);
        return BypassKeyResponse.fromEntity(updated);
    }

    /**
     * Xóa Bypass Key.
     * Chặn xóa nếu key đã có lịch sử sử dụng để đảm bảo tính toàn vẹn kiểm toán (Audit Trail).
     */
    public void deleteKey(Long id) {
        BypassKey key = bypassKeyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Bypass Key với id: " + id));

        if (key.getUsedCount() > 0 || bypassKeyUsageRepository.countByBypassKeyId(id) > 0) {
            throw new BadRequestException("Không thể xóa Bypass Key đã có lượt sử dụng thực tế (" + key.getUsedCount() + " lượt). " +
                    "Bạn vui lòng chuyển trạng thái sang Tạm khóa (DISABLED) nếu không muốn cho phép sử dụng tiếp.");
        }

        bypassKeyRepository.delete(key);
    }

    /**
     * Lấy danh sách lịch sử các lần sử dụng của một Bypass Key.
     */
    @Transactional(readOnly = true)
    public List<BypassKeyUsageResponse> getKeyUsages(Long id) {
        if (!bypassKeyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Bypass Key với id: " + id);
        }

        return bypassKeyUsageRepository.findByBypassKeyIdOrderByUsedAtDesc(id).stream()
                .map(BypassKeyUsageResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

