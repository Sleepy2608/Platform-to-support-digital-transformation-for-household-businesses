package com.hbdt.accounting.dto;

import com.hbdt.entity.enums.TemplateType;

import java.util.List;
import java.util.Map;

public record FilledTemplateReportResponse(
        Long templateId,
        Long templateVersionId,
        Integer versionNumber,
        String templateCode,
        String templateName,
        TemplateType templateType,
        String officialFormCode,
        String legalBasis,
        List<FilledTemplateColumnResponse> columns,
        List<Map<String, Object>> rows,
        List<String> warnings
) {
}
