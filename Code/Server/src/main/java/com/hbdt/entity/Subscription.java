package com.hbdt.entity;

import com.hbdt.entity.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions", indexes = {
        @Index(name = "idx_subscriptions_business_status", columnList = "business_id, status"),
        @Index(name = "idx_subscriptions_end_date", columnList = "end_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long userId;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private SubscriptionPlan plan;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Setter(AccessLevel.NONE)
    private SubscriptionStatus status;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enforce status transitions:
     * PENDING_PAYMENT -> ACTIVE
     * ACTIVE -> EXPIRED
     * ACTIVE -> CANCELLED
     */
    public void setStatus(SubscriptionStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Subscription status must not be null");
        }
        if (this.status != null && this.status != newStatus && !this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException("Transition from " + this.status + " to " + newStatus + " is not allowed");
        }
        this.status = newStatus;
    }

    public void cancel(String reason, LocalDateTime cancelledAt) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Cancellation reason must not be blank");
        }
        setStatus(SubscriptionStatus.CANCELLED);
        this.cancelledAt = cancelledAt;
        this.cancellationReason = reason.trim();
    }

    @PrePersist
    protected void onCreate() {
        if (this.status == null) {
            this.status = SubscriptionStatus.PENDING_PAYMENT;
        }
        if (this.status == SubscriptionStatus.ACTIVE) {
            throw new IllegalStateException("Cannot create a subscription directly in ACTIVE status");
        }
        validateDates();
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        validateDates();
        updatedAt = LocalDateTime.now();
    }

    private void validateDates() {
        if (startDate == null || endDate == null || !startDate.isBefore(endDate)) {
            throw new IllegalStateException("Subscription start date must be before end date");
        }
    }
}
