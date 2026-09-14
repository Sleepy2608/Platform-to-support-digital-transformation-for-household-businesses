package com.hbdt.admin.dto.template;

import com.fasterxml.jackson.databind.JsonNode;
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
    private String status;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
    private LocalDateTime createdAt;
}
