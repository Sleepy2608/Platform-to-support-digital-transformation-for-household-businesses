package com.hbdt.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Integration bridge between the Template Management module and the
 * Financial Reports engine.
 *
 * <p>This service resolves the correct template version for report
 * generation and maps raw accounting data into the template's JSON
 * schema. It enforces that only ACTIVE templates may be used.</p>
 */
@Service
public class TemplateIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(TemplateIntegrationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ReportTemplateRepository templateRepository;
    private final ReportTemplateVersionRepository versionRepository;

    public TemplateIntegrationService(ReportTemplateRepository templateRepository,
                                      ReportTemplateVersionRepository versionRepository) {
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
    }

    /**
     * Resolves the currently active template version for a given type.
     *
     * @param type the template category (e.g., REVENUE_LEDGER)
     * @return the active version of the matching template
     * @throws ResourceNotFoundException if no template of this type exists
     * @throws BadRequestException       if the template is INACTIVE
     */
    @Transactional(readOnly = true)
    public ReportTemplateVersion getActiveTemplateVersion(TemplateType type) {
        ReportTemplate template = templateRepository
                .findByTemplateTypeAndStatus(type, TemplateStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mẫu báo cáo ACTIVE cho loại: " + type));

        if (template.getStatus() != TemplateStatus.ACTIVE) {
            throw new BadRequestException(
                    "Mẫu báo cáo '" + template.getTemplateName() + "' đang ở trạng thái " +
                    template.getStatus() + ", không thể sử dụng để tạo báo cáo");
        }

        if (template.getCurrentVersionId() == null) {
            throw new IllegalStateException(
                    "Template id=" + template.getId() + " has no current version — data integrity error");
        }

        return versionRepository.findById(template.getCurrentVersionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Current version id=" + template.getCurrentVersionId() + " not found"));
    }

    /**
     * Placeholder: Maps raw accounting data into the template's JSON schema
     * to produce a populated report payload.
     *
     * <p>In production, this would iterate over the template schema's field
     * definitions and fill each field with the corresponding value from
     * the accounting data map. For now, it demonstrates the contract.</p>
     *
     * @param version        the template version whose schema defines the layout
     * @param accountingData key-value pairs of accounting metrics
     *                       (e.g., "totalRevenue" → 15000000)
     * @return a JSON node representing the filled-in report data
     */
    public JsonNode mapAccountingDataToTemplate(ReportTemplateVersion version,
                                                 Map<String, BigDecimal> accountingData) {
        JsonNode schema = version.getTemplateSchema();
        ObjectNode reportData = objectMapper.createObjectNode();

        // Copy the template schema as the structural base
        reportData.put("templateVersionId", version.getId());
        reportData.put("versionNumber", version.getVersionNumber());

        // Map each field defined in the schema to its accounting value
        ObjectNode fieldsNode = objectMapper.createObjectNode();
        if (schema.has("fields") && schema.get("fields").isArray()) {
            for (JsonNode fieldDef : schema.get("fields")) {
                String fieldKey = fieldDef.has("key") ? fieldDef.get("key").asText() : null;
                if (fieldKey != null && accountingData.containsKey(fieldKey)) {
                    fieldsNode.put(fieldKey, accountingData.get(fieldKey));
                } else if (fieldKey != null) {
                    fieldsNode.putNull(fieldKey);
                }
            }
        }
        reportData.set("data", fieldsNode);

        logger.debug("Mapped {} accounting fields into template version v{}",
                accountingData.size(), version.getVersionNumber());

        return reportData;
    }
}
