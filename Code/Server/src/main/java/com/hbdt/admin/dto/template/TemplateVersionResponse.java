package com.hbdt.admin.dto.template;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.entity.enums.VersionStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response for a single template version entry in the history list.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateVersionResponse {

    private Long id;
    private Integer versionNumber;
    private JsonNode configurationJson;
    private Long updatedBy;
    private VersionStatus status;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private String changeSummary;
    private LocalDateTime createdAt;
}
