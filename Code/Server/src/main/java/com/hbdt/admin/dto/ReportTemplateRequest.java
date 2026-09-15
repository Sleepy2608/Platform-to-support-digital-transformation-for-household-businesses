package com.hbdt.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportTemplateRequest(@NotBlank @Size(max=50) String templateCode,
        @NotBlank @Size(max=255) String templateName, @NotBlank @Size(max=30) String templateType,
        @Size(max=50) String officialFormCode, @Size(max=255) String legalBasis,
        @Size(max=1000) String description) { }
