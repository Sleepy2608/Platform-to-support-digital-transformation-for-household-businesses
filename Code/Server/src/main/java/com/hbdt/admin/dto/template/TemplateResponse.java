package com.hbdt.admin.dto.template;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed response for a single template, including its
 * current active version and full version history.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateResponse {

    private Long id;
    private String templateCode;
    private String templateName;
    private TemplateType templateType;
    private String officialFormCode;
    private String legalBasis;
    private String description;
    private TemplateStatus status;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Current active version snapshot
    private Long currentVersionId;
    private Integer currentVersionNumber;
    private JsonNode currentConfigurationJson;

    // Full version history
    private List<TemplateVersionResponse> versionHistory;
}
