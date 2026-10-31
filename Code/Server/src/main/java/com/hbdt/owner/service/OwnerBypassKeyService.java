package com.hbdt.owner.service;

import com.hbdt.entity.BypassKey;
import com.hbdt.entity.SubscriptionPlan;
import com.hbdt.entity.enums.BypassKeyStatus;
import com.hbdt.owner.dto.ValidateBypassKeyRequest;
import com.hbdt.owner.dto.ValidateBypassKeyResponse;
import com.hbdt.repository.BypassKeyRepository;
import com.hbdt.repository.SubscriptionPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class OwnerBypassKeyService {

    private final BypassKeyRepository bypassKeyRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    public OwnerBypassKeyService(BypassKeyRepository bypassKeyRepository,
                                 SubscriptionPlanRepository subscriptionPlanRepository) {
        this.bypassKeyRepository = bypassKeyRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
    }

    /**
     * Xác thực mã Bypass Key do chủ hộ kinh doanh (Owner) nhập vào khi thanh toán gói cước.
     */
    public ValidateBypassKeyResponse validateKey(ValidateBypassKeyRequest request) {
        String keyCode = request.getKeyCode() != null ? request.getKeyCode().trim() : "";

        if (keyCode.isEmpty()) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .message("Vui lòng nhập mã Bypass Key")
                    .build();
        }

        if (!keyCode.matches("^[a-zA-Z0-9]{20}$")) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key phải gồm chính xác 20 ký tự chữ và số")
                    .build();
        }

        Optional<BypassKey> keyOpt = bypassKeyRepository.findByKeyCode(keyCode);
        if (keyOpt.isEmpty()) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key không tồn tại hoặc không chính xác")
                    .build();
        }

        BypassKey key = keyOpt.get();

        if (key.getStatus() == BypassKeyStatus.DISABLED) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key này hiện đang bị tạm khóa bởi quản trị viên")
                    .build();
        }

        if (key.getStatus() == BypassKeyStatus.DEPLETED ||
                (key.getMaxUses() != null && key.getUsedCount() != null && key.getUsedCount() >= key.getMaxUses())) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key này đã sử dụng hết số lượt cho phép (" + key.getMaxUses() + " lượt)")
                    .build();
        }

        if (key.getExpiresAt() != null && key.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key này đã hết hạn sử dụng vào ngày " + key.getExpiresAt())
                    .build();
        }

        if (key.getStatus() != BypassKeyStatus.ACTIVE) {
            return ValidateBypassKeyResponse.builder()
                    .valid(false)
                    .keyCode(keyCode)
                    .message("Mã Bypass Key hiện không khả dụng (Trạng thái: " + key.getStatus().getDescription() + ")")
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
            }
        }

        int remaining = Math.max(0, key.getMaxUses() - key.getUsedCount());

        return ValidateBypassKeyResponse.builder()
                .valid(true)
                .keyCode(key.getKeyCode())
                .discountPercent(100)
                .originalAmount(originalAmount)
                .discountAmount(originalAmount)
                .finalAmount(BigDecimal.ZERO)
                .message("Áp dụng mã Bypass Key thành công! Bạn được giảm 100% chi phí.")
                .remainingUses(remaining)
                .expiresAt(key.getExpiresAt())
                .build();
    }
}

