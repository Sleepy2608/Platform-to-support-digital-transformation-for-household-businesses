package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback", indexes = {
        @Index(name = "idx_feedback_submitted_created", columnList = "submitted_by,created_at"),
        @Index(name = "idx_feedback_business_created", columnList = "business_id,created_at"),
        @Index(name = "idx_feedback_status_type", columnList = "status,feedback_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "submitted_by", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long submittedBy;

    @Column(name = "resolved_by", columnDefinition = "BIGINT UNSIGNED")
    private Long resolvedBy;

    @Column(name = "feedback_type", nullable = false, length = 30)
    private String feedbackType;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
