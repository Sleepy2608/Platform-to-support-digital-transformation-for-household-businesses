package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "subscription_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long subscriptionId;

    @Column(name = "old_plan", length = 50)
    private String oldPlan;

    @Column(name = "new_plan", length = 50)
    private String newPlan;

    @Column(name = "action", nullable = false, length = 20)
    private String action; // UPGRADE, DOWNGRADE, RENEWAL

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }
}
