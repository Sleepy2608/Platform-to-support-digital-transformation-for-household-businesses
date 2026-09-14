package com.hbdt.entity;

import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Parent entity representing a financial report template.
 * Each template tracks its type, status, and a pointer to the
 * currently active version ({@link ReportTemplateVersion}).
 *
 * <p>Versioning contract: the template itself holds metadata,
 * while the actual configuration/layout lives in its versions.
 * When configuration changes, a new version is created — existing
 * versions are never mutated, ensuring historical integrity.</p>
 */
@Entity
@Table(name = "report_templates", uniqueConstraints = @UniqueConstraint(
        name = "uk_report_templates_code", columnNames = "template_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "template_code", nullable = false, length = 50)
    private String templateCode;

    @Column(name = "template_name", nullable = false, length = 255)
    private String templateName;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false, length = 30)
    private TemplateType templateType;

    @Column(name = "official_form_code", length = 50)
    private String officialFormCode;

    @Column(name = "legal_basis", length = 255)
    private String legalBasis;

    @Column(name = "description", length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TemplateStatus status = TemplateStatus.ACTIVE;

    /**
     * FK pointer to the currently active {@link ReportTemplateVersion}.
     * Updated each time a new version is created via the update flow.
     */
    @Column(name = "current_version_id", columnDefinition = "BIGINT UNSIGNED")
    private Long currentVersionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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
