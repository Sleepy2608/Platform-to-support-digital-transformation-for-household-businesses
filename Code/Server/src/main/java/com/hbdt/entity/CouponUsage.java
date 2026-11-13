package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupon_usages", indexes = {
        @Index(name = "idx_coupon_usages_key", columnList = "coupon_id"),
        @Index(name = "idx_coupon_usages_user", columnList = "user_id"),
        @Index(name = "idx_coupon_usages_business", columnList = "business_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long userId;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "package_type", nullable = false, length = 50)
    private String packageType;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "original_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal discountAmount;

    @Column(name = "final_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @PrePersist
    protected void onCreate() {
        if (this.usedAt == null) {
            this.usedAt = LocalDateTime.now();
        }
        if (this.finalAmount == null) {
            this.finalAmount = BigDecimal.ZERO;
        }
    }
}

