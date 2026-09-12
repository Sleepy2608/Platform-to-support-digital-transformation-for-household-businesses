package com.hbdt.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Immutable snapshot of a template's configuration at a point in time.
 *
 * <p>Core versioning rule: once persisted, a version's
 * {@code templateSchema} is <b>never</b> modified. Any change to
 * the template configuration creates a new version row with an
 * incremented {@code versionNumber}.</p>
 *
 * <p>{@link GeneratedReport} links to a specific version (not the
 * parent template) so that historical reports always reflect the
 * exact layout they were generated with.</p>
 */
@Entity
@Table(name = "report_template_versions", uniqueConstraints = @UniqueConstraint(
        name = "uk_report_template_versions_number",
        columnNames = {"report_template_id", "version_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportTemplateVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "report_template_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long reportTemplateId;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    /**
     * Who (admin user ID) authored this particular version.
     * Distinct from {@code createdBy} which may track the original creator.
     */
    @Column(name = "updated_by", columnDefinition = "BIGINT UNSIGNED")
    private Long updatedBy;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    /**
     * The full template layout/configuration stored as JSON.
     * This is the immutable "schema" that report generation reads from.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "template_schema", nullable = false, columnDefinition = "json")
    private JsonNode templateSchema;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

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
