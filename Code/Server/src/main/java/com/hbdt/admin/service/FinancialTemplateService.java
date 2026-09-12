package com.hbdt.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.admin.dto.template.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Core service for managing Financial Report Templates.
 *
 * <h3>Versioning Contract</h3>
 * <ul>
 *   <li>Each template has one or more immutable {@link ReportTemplateVersion} rows.</li>
 *   <li>On update, if the configuration or name changes, a <b>new</b> version is
 *       created — existing versions are never mutated.</li>
 *   <li>The parent template's {@code currentVersionId} always points to the
 *       latest version.</li>
 * </ul>
 */
@Service
public class FinancialTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(FinancialTemplateService.class);

    private final ReportTemplateRepository templateRepository;
    private final ReportTemplateVersionRepository versionRepository;

    public FinancialTemplateService(ReportTemplateRepository templateRepository,
                                    ReportTemplateVersionRepository versionRepository) {
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
    }

    // ──────────────────────────────────────────────────────────────────────
    // CREATE
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Creates a new template with an initial version (v1).
     * Both the template and its first version are persisted atomically.
     *
     * @param request   validated creation payload
     * @param adminUserId  ID of the admin performing the action
     * @return detailed response with version info
     */
    @Transactional
    public TemplateResponse create(CreateTemplateRequest request, Long adminUserId) {
        // Uniqueness guard
        if (templateRepository.existsByTemplateCode(request.getTemplateCode())) {
            throw new BadRequestException(
                    "Mã mẫu '" + request.getTemplateCode() + "' đã tồn tại trong hệ thống");
        }

        // 1. Persist the parent template
        ReportTemplate template = ReportTemplate.builder()
                .templateCode(request.getTemplateCode().trim())
                .templateName(request.getName().trim())
                .templateType(request.getType())
                .officialFormCode(request.getOfficialFormCode())
                .legalBasis(request.getLegalBasis())
                .description(request.getDescription())
                .status(TemplateStatus.ACTIVE)
                .createdBy(adminUserId)
                .build();
        template = templateRepository.save(template);

        // 2. Create initial version (v1)
        ReportTemplateVersion v1 = ReportTemplateVersion.builder()
                .reportTemplateId(template.getId())
                .versionNumber(1)
                .templateSchema(request.getConfigurationJson())
                .effectiveFrom(LocalDate.now())
                .status("ACTIVE")
                .createdBy(adminUserId)
                .updatedBy(adminUserId)
                .build();
        v1 = versionRepository.save(v1);

        // 3. Point parent to this version
        template.setCurrentVersionId(v1.getId());
        template = templateRepository.save(template);

        logger.info("Template created: id={}, code={}, v1.id={}",
                template.getId(), template.getTemplateCode(), v1.getId());

        return toDetailResponse(template, v1, List.of(toVersionResponse(v1)));
    }

    // ──────────────────────────────────────────────────────────────────────
    // LIST (paginated + filtered)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Returns a paginated, filterable, searchable list of templates.
     *
     * @param type    optional filter by TemplateType
     * @param status  optional filter by TemplateStatus
     * @param search  optional keyword search on template name
     */
    @Transactional(readOnly = true)
    public Page<TemplateListResponse> getList(TemplateType type,
                                              TemplateStatus status,
                                              String search,
                                              Pageable pageable) {
        Specification<ReportTemplate> spec = buildSpecification(type, status, search);

        return templateRepository.findAll(spec, pageable).map(template -> {
            Integer currentVersionNumber = resolveCurrentVersionNumber(template);
            return TemplateListResponse.builder()
                    .id(template.getId())
                    .templateCode(template.getTemplateCode())
                    .templateName(template.getTemplateName())
                    .templateType(template.getTemplateType())
                    .currentVersionNumber(currentVersionNumber)
                    .status(template.getStatus())
                    .updatedAt(template.getUpdatedAt())
                    .build();
        });
    }

    // ──────────────────────────────────────────────────────────────────────
    // DETAIL
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Returns full template details including current configuration
     * and the complete version history.
     */
    @Transactional(readOnly = true)
    public TemplateResponse getDetail(Long templateId) {
        ReportTemplate template = findTemplateOrThrow(templateId);

        List<ReportTemplateVersion> versions =
                versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(templateId);

        List<TemplateVersionResponse> versionResponses = versions.stream()
                .map(this::toVersionResponse)
                .toList();

        // Find the current active version
        ReportTemplateVersion currentVersion = versions.stream()
                .filter(v -> v.getId().equals(template.getCurrentVersionId()))
                .findFirst()
                .orElse(versions.isEmpty() ? null : versions.get(0));

        return toDetailResponse(template, currentVersion, versionResponses);
    }

    // ──────────────────────────────────────────────────────────────────────
    // UPDATE (strict versioning)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Updates a template. If the name or configuration has changed
     * compared to the current version, a <b>new</b> version is created.
     * The previous version is never modified — this is the core
     * immutability guarantee.
     *
     * @param templateId   target template
     * @param request      update payload
     * @param adminUserId  ID of the admin performing the action
     */
    @Transactional
    public TemplateResponse update(Long templateId,
                                   UpdateTemplateRequest request,
                                   Long adminUserId) {
        ReportTemplate template = findTemplateOrThrow(templateId);

        // Resolve the current/latest version
        ReportTemplateVersion latestVersion = versionRepository
                .findTopByReportTemplateIdOrderByVersionNumberDesc(templateId)
                .orElseThrow(() -> new IllegalStateException(
                        "Template id=" + templateId + " has no versions — data integrity error"));

        // Detect whether a new version is needed
        boolean nameChanged = !template.getTemplateName().equals(request.getName().trim());
        boolean configChanged = !latestVersion.getTemplateSchema().equals(request.getConfigurationJson());

        // Update parent metadata (always safe — these are non-versioned fields)
        template.setTemplateName(request.getName().trim());
        template.setOfficialFormCode(request.getOfficialFormCode());
        template.setLegalBasis(request.getLegalBasis());
        template.setDescription(request.getDescription());

        ReportTemplateVersion activeVersion;

        if (nameChanged || configChanged) {
            // ── Create a new immutable version ──
            int nextVersionNumber = latestVersion.getVersionNumber() + 1;

            // Close out the previous version's effective period
            latestVersion.setEffectiveTo(LocalDate.now());
            latestVersion.setStatus("SUPERSEDED");
            versionRepository.save(latestVersion);

            ReportTemplateVersion newVersion = ReportTemplateVersion.builder()
                    .reportTemplateId(templateId)
                    .versionNumber(nextVersionNumber)
                    .templateSchema(request.getConfigurationJson())
                    .effectiveFrom(LocalDate.now())
                    .status("ACTIVE")
                    .createdBy(latestVersion.getCreatedBy())
                    .updatedBy(adminUserId)
                    .build();
            activeVersion = versionRepository.save(newVersion);

            template.setCurrentVersionId(activeVersion.getId());

            logger.info("Template id={} updated: new version v{} created by adminId={}",
                    templateId, nextVersionNumber, adminUserId);
        } else {
            activeVersion = latestVersion;
            logger.info("Template id={} metadata updated (no version change)", templateId);
        }

        template = templateRepository.save(template);

        // Reload full history for the response
        List<TemplateVersionResponse> versionHistory =
                versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(templateId)
                        .stream()
                        .map(this::toVersionResponse)
                        .toList();

        return toDetailResponse(template, activeVersion, versionHistory);
    }

    // ──────────────────────────────────────────────────────────────────────
    // STATUS TOGGLE (activate / deactivate)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Toggles a template's status between ACTIVE and INACTIVE.
     * INACTIVE templates cannot be used to generate new reports.
     */
    @Transactional
    public TemplateResponse updateStatus(Long templateId, TemplateStatus newStatus) {
        ReportTemplate template = findTemplateOrThrow(templateId);

        if (template.getStatus() == newStatus) {
            throw new BadRequestException(
                    "Mẫu báo cáo đã ở trạng thái " + newStatus);
        }

        template.setStatus(newStatus);
        template = templateRepository.save(template);

        logger.info("Template id={} status changed to {}", templateId, newStatus);

        return getDetail(templateId);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────

    private ReportTemplate findTemplateOrThrow(Long templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Mẫu báo cáo", "id", templateId));
    }

    /**
     * Builds a dynamic JPA Specification for list filtering.
     */
    private Specification<ReportTemplate> buildSpecification(TemplateType type,
                                                              TemplateStatus status,
                                                              String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null) {
                predicates.add(cb.equal(root.get("templateType"), type));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("templateName")), pattern),
                        cb.like(cb.lower(root.get("templateCode")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Integer resolveCurrentVersionNumber(ReportTemplate template) {
        if (template.getCurrentVersionId() == null) {
            return null;
        }
        return versionRepository.findById(template.getCurrentVersionId())
                .map(ReportTemplateVersion::getVersionNumber)
                .orElse(null);
    }

    // ── Mapping helpers ──

    private TemplateResponse toDetailResponse(ReportTemplate template,
                                               ReportTemplateVersion currentVersion,
                                               List<TemplateVersionResponse> versionHistory) {
        return TemplateResponse.builder()
                .id(template.getId())
                .templateCode(template.getTemplateCode())
                .templateName(template.getTemplateName())
                .templateType(template.getTemplateType())
                .officialFormCode(template.getOfficialFormCode())
                .legalBasis(template.getLegalBasis())
                .description(template.getDescription())
                .status(template.getStatus())
                .createdBy(template.getCreatedBy())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .currentVersionId(currentVersion != null ? currentVersion.getId() : null)
                .currentVersionNumber(currentVersion != null ? currentVersion.getVersionNumber() : null)
                .currentConfigurationJson(currentVersion != null ? currentVersion.getTemplateSchema() : null)
                .versionHistory(versionHistory)
                .build();
    }

    private TemplateVersionResponse toVersionResponse(ReportTemplateVersion version) {
        return TemplateVersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .configurationJson(version.getTemplateSchema())
                .updatedBy(version.getUpdatedBy())
                .status(version.getStatus())
                .effectiveFrom(version.getEffectiveFrom())
                .effectiveTo(version.getEffectiveTo())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
