package com.hbdt.owner.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.entity.enums.ReportStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for report review — contains all information
 * the Owner needs to inspect, edit, confirm or reject a report.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportReviewResponse {

    private Long id;
    private Long businessId;
    private Long templateVersionId;

    /** Resolved from ReportTemplate for display convenience. */
    private String templateName;
    private String templateType;

    private LocalDate reportingPeriodFrom;
    private LocalDate reportingPeriodTo;
    private Integer generationNo;
    private String generationMethod;

    /** The actual report data (JSON rows/columns). */
    private JsonNode reportData;
    private String fileUrl;

    private ReportStatus status;
    private String rejectionReason;

    // Audit trail
    private Long createdBy;
    private Long reviewedBy;
    private Long editedBy;
    private Long rejectedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime editedAt;
}
