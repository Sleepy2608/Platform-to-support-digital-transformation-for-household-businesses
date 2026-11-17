package com.hbdt.entity;

import com.hbdt.entity.enums.CouponStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons", indexes = {
        @Index(name = "idx_coupons_code", columnList = "key_code", unique = true),
        @Index(name = "idx_coupons_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "key_code", nullable = false, unique = true, length = 20)
    private String keyCode;

    @Column(name = "max_uses", nullable = false)
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CouponStatus status = CouponStatus.ACTIVE;

    @Column(name = "note", length = 255)
    private String note;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.usedCount == null) {
            this.usedCount = 0;
        }
        if (this.status == null) {
            this.status = CouponStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal discountAmount(BigDecimal originalAmount) {
        if (discountPercent == 100) {
            return originalAmount;
        }
        return originalAmount.multiply(BigDecimal.valueOf(discountPercent)).movePointLeft(2)
                .setScale(0, RoundingMode.DOWN);
    }

    /**
     * Kiểm tra xem key có còn khả dụng hay không
     */
    public boolean isUsable() {
        if (this.status != CouponStatus.ACTIVE) {
            return false;
        }
        if (this.maxUses != null && this.usedCount != null && this.usedCount >= this.maxUses) {
            return false;
        }
        if (this.expiresAt != null && this.expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }
        return true;
    }
}

