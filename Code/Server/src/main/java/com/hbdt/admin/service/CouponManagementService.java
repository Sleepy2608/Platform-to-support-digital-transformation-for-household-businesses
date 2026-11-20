package com.hbdt.admin.service;

import com.hbdt.admin.dto.coupon.CouponCreateRequest;
import com.hbdt.admin.dto.coupon.CouponResponse;
import com.hbdt.admin.dto.coupon.CouponSummaryResponse;
import com.hbdt.admin.dto.coupon.CouponUsageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Coupon;
import com.hbdt.entity.enums.CouponStatus;
import com.hbdt.repository.CouponRepository;
import com.hbdt.repository.CouponCheckoutRepository;
import com.hbdt.repository.CouponUsageRepository;
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
public class CouponManagementService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponCheckoutRepository checkoutRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private static final String DIGITS = "0123456789";
    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String ALL_CHARS = DIGITS + UPPERCASE + LOWERCASE;

    public CouponManagementService(CouponRepository couponRepository,
                                 CouponUsageRepository couponUsageRepository,
                                   CouponCheckoutRepository checkoutRepository) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.checkoutRepository = checkoutRepository;
    }

    /**
     * Sinh ngẫu nhiên mã giảm giá gồm chính xác 20 ký tự (chữ hoa A-Z, chữ thường a-z và số 0-9) bảo mật cao.
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
            if (!couponRepository.existsByKeyCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Không thể sinh mã giảm giá duy nhất sau nhiều lần thử, vui lòng thử lại.");
    }

    /**
     * Tạo Coupon mới.
     */
    public CouponResponse createKey(CouponCreateRequest request, String username) {
        String keyCode = request.getKeyCode() != null ? request.getKeyCode().trim() : "";

        if (keyCode.isEmpty()) {
            keyCode = generateSecure20DigitCode();
        } else {
            if (!keyCode.matches("^[a-zA-Z0-9]{20}$")) {
                throw new BadRequestException("Mã giảm giá phải gồm đúng 20 ký tự chữ và số (0-9, a-z, A-Z)");
            }
            if (couponRepository.existsByKeyCode(keyCode)) {
                throw new BadRequestException("Mã giảm giá " + keyCode + " đã tồn tại trên hệ thống");
            }
        }

        // Nếu số lần dùng <= 0 hoặc để trống thì mặc định tính là 1
        int maxUses = (request.getMaxUses() == null || request.getMaxUses() <= 0) ? 1 : request.getMaxUses();

        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Thời gian hết hạn phải ở tương lai");
        }

        Integer discountPercent = request.getDiscountPercent();
        if (discountPercent == null || discountPercent < 1 || discountPercent > 100) {
            throw new BadRequestException("Phần trăm giảm giá phải từ 1 đến 100");
        }

        Coupon coupon = Coupon.builder()
                .keyCode(keyCode)
                .maxUses(maxUses)
                .usedCount(0)
                .discountPercent(discountPercent)
                .status(CouponStatus.ACTIVE)
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .expiresAt(request.getExpiresAt())
                .createdBy(username)
                .build();

        Coupon saved = couponRepository.save(coupon);
        return CouponResponse.fromEntity(saved);
    }

    /**
     * Tìm kiếm và phân trang danh sách Coupon.
     */
    @Transactional(readOnly = true)
    public Page<CouponResponse> searchKeys(String keyword, CouponStatus status, int page, int size) {
        String trimmedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Coupon> keyPage = couponRepository.searchCoupons(trimmedKeyword, status, pageable);
        return keyPage.map(CouponResponse::fromEntity);
    }

    /**
     * Lấy thông tin chi tiết một Coupon theo ID.
     */
    @Transactional(readOnly = true)
    public CouponResponse getKeyById(Long id) {
        Coupon key = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Coupon với id: " + id));
        return CouponResponse.fromEntity(key);
    }

    /**
     * Lấy dữ liệu tổng hợp số liệu thống kê Coupon cho Admin.
     */
    @Transactional(readOnly = true)
    public CouponSummaryResponse getSummary() {
        long total = couponRepository.count();
        long active = couponRepository.countByStatus(CouponStatus.ACTIVE);
        long depleted = couponRepository.countByStatus(CouponStatus.DEPLETED);
        long disabled = couponRepository.countByStatus(CouponStatus.DISABLED);
        long expired = couponRepository.countByStatus(CouponStatus.EXPIRED);
        long totalUsages = couponRepository.sumTotalUsedCount();

        return CouponSummaryResponse.builder()
                .totalKeys(total)
                .activeKeys(active)
                .depletedKeys(depleted)
                .disabledKeys(disabled)
                .expiredKeys(expired)
                .totalUsages(totalUsages)
                .build();
    }

    /**
     * Cập nhật trạng thái của Coupon (Bật/Tắt).
     */
    public CouponResponse updateStatus(Long id, CouponStatus newStatus) {
        if (newStatus == null) {
            throw new BadRequestException("Trạng thái mới không được để trống");
        }

        Coupon key = couponRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Coupon với id: " + id));

        key.setStatus(newStatus);
        Coupon updated = couponRepository.save(key);
        return CouponResponse.fromEntity(updated);
    }

    /**
     * Xóa Coupon.
     * Chặn xóa nếu key đã có lịch sử sử dụng để đảm bảo tính toàn vẹn kiểm toán (Audit Trail).
     */
    public void deleteKey(Long id) {
        Coupon key = couponRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Coupon với id: " + id));

        if (key.getUsedCount() > 0 || couponUsageRepository.countByCouponId(id) > 0) {
            throw new BadRequestException("Không thể xóa Coupon đã có lượt sử dụng thực tế (" + key.getUsedCount() + " lượt). " +
                    "Bạn vui lòng chuyển trạng thái sang Tạm khóa (DISABLED) nếu không muốn cho phép sử dụng tiếp.");
        }

        if (!checkoutRepository.findReservations(id, LocalDateTime.now()).isEmpty()) {
            throw new BadRequestException("Không thể xóa mã giảm giá đang chờ thanh toán");
        }
        couponRepository.delete(key);
    }

    /**
     * Lấy danh sách lịch sử các lần sử dụng của một Coupon.
     */
    @Transactional(readOnly = true)
    public List<CouponUsageResponse> getKeyUsages(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Coupon với id: " + id);
        }

        return couponUsageRepository.findByCouponIdOrderByUsedAtDesc(id).stream()
                .map(CouponUsageResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

