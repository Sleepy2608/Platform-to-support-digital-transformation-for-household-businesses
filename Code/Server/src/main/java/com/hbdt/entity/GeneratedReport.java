package com.hbdt.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "generated_reports", uniqueConstraints = @UniqueConstraint(
        name = "uk_generated_reports_generation",
        columnNames = {"business_id", "template_version_id", "reporting_period_from", "reporting_period_to", "generation_no"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratedReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "template_version_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long templateVersionId;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "reviewed_by", columnDefinition = "BIGINT UNSIGNED")
    private Long reviewedBy;

    @Column(name = "reporting_period_from", nullable = false)
    private LocalDate reportingPeriodFrom;

    @Column(name = "reporting_period_to", nullable = false)
    private LocalDate reportingPeriodTo;

    @Column(name = "generation_no", nullable = false)
    private Integer generationNo;

    @Column(name = "generation_method", nullable = false, length = 20)
    private String generationMethod;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "report_data", nullable = false, columnDefinition = "json")
    private JsonNode reportData;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
