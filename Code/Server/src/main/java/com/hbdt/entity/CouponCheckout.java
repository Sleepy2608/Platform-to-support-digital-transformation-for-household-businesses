package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupon_checkouts", indexes = @Index(name = "idx_coupon_checkout_reservations",
        columnList = "coupon_id,paid_at,expires_at"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponCheckout {
    @Id
    @Column(name = "reference", length = 22)
    private String reference;

    @Column(name = "coupon_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long couponId;

    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long userId;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "renewal_months")
    private Integer renewalMonths;

    @Column(name = "subscription_id", columnDefinition = "BIGINT UNSIGNED")
    private Long subscriptionId;

    @Column(name = "original_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "final_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
