package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_order_drafts", indexes = {
        @Index(name = "idx_ai_drafts_business_status", columnList = "business_id,status,created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiOrderDraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "created_by", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "reviewed_by", columnDefinition = "BIGINT UNSIGNED")
    private Long reviewedBy;

    @Column(name = "sales_order_id", columnDefinition = "BIGINT UNSIGNED")
    private Long salesOrderId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "source_text", nullable = false, length = 4000)
    private String sourceText;

    @Column(name = "proposal_json", nullable = false, columnDefinition = "LONGTEXT")
    private String proposalJson;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
