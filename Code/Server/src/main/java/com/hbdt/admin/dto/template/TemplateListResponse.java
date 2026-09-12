package com.hbdt.admin.dto.template;

import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lightweight response for the template list view (table rows).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateListResponse {

    private Long id;
    private String templateCode;
    private String templateName;
    private TemplateType templateType;
    private Integer currentVersionNumber;
    private TemplateStatus status;
    private LocalDateTime updatedAt;
}
