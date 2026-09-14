package com.hbdt.owner.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.GeneratedReport;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.ReportStatus;
import com.hbdt.owner.dto.ReportRejectRequest;
import com.hbdt.owner.dto.ReportReviewResponse;
import com.hbdt.owner.dto.ReportUpdateRequest;
import com.hbdt.repository.GeneratedReportRepository;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Service handling the Owner's report review workflow.
 *
 * <h3>Status Transitions</h3>
 * <pre>
 *   DRAFT ──→ PENDING_REVIEW ──→ CONFIRMED
 *                              └→ REJECTED
 * </pre>
 *
 * <p>Ownership is enforced on every operation: a report can only
 * be accessed/modified by the Owner whose {@code businessId}
 * matches {@code GeneratedReport.businessId}.</p>
 */
@Service
public class ReportReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReportReviewService.class);

    /** Statuses that allow editing. */
    private static final Set<ReportStatus> EDITABLE_STATUSES =
            Set.of(ReportStatus.DRAFT, ReportStatus.PENDING_REVIEW);

    /** Statuses that allow confirm/reject actions. */
    private static final Set<ReportStatus> REVIEWABLE_STATUSES =
            Set.of(ReportStatus.PENDING_REVIEW);

    private final GeneratedReportRepository reportRepository;
    private final ReportTemplateVersionRepository versionRepository;
    private final ReportTemplateRepository templateRepository;
    private final UserRepository userRepository;

    public ReportReviewService(GeneratedReportRepository reportRepository,
                               ReportTemplateVersionRepository versionRepository,
                               ReportTemplateRepository templateRepository,
                               UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.versionRepository = versionRepository;
        this.templateRepository = templateRepository;
        this.userRepository = userRepository;
    }

    // ──────────────────────────────────────────────────────────────────────
    // LIST
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Returns a paginated list of reports belonging to the Owner's business.
     *
     * @param username authenticated Owner username
     * @param status   optional filter
     * @param pageable pagination info
     */
    @Transactional(readOnly = true)
    public Page<ReportReviewResponse> getReports(String username,
                                                  ReportStatus status,
                                                  Pageable pageable) {
        User owner = resolveOwner(username);
        Long businessId = owner.getBusinessId();

        Page<GeneratedReport> page;
        if (status != null) {
            page = reportRepository.findByBusinessIdAndStatus(businessId, status, pageable);
        } else {
            page = reportRepository.findByBusinessId(businessId, pageable);
        }

        return page.map(this::toResponse);
    }

    // ──────────────────────────────────────────────────────────────────────
    // DETAIL
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Returns full details for a single report. Ownership is verified.
     */
    @Transactional(readOnly = true)
    public ReportReviewResponse getReportDetail(String username, Long reportId) {
        User owner = resolveOwner(username);
        GeneratedReport report = findReportForOwner(reportId, owner.getBusinessId());
        return toResponse(report);
    }

    // ──────────────────────────────────────────────────────────────────────
    // EDIT
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Allows Owner to edit report data.
     * Only permitted when status is DRAFT or PENDING_REVIEW.
     * After editing, status transitions to PENDING_REVIEW.
     */
    @Transactional
    public ReportReviewResponse editReport(String username,
                                            Long reportId,
                                            ReportUpdateRequest request) {
        User owner = resolveOwner(username);
        GeneratedReport report = findReportForOwner(reportId, owner.getBusinessId());

        assertStatusAllows(report, EDITABLE_STATUSES,
                "Không thể chỉnh sửa báo cáo ở trạng thái " + report.getStatus());

        report.setReportData(request.getReportData());
        report.setEditedBy(owner.getId());
        report.setEditedAt(LocalDateTime.now());
        report.setStatus(ReportStatus.PENDING_REVIEW);

        report = reportRepository.save(report);

        logger.info("Report id={} edited by userId={}, status → PENDING_REVIEW",
                reportId, owner.getId());

        return toResponse(report);
    }

    // ──────────────────────────────────────────────────────────────────────
    // CONFIRM
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Owner confirms the report data is accurate.
     * Only permitted when status is PENDING_REVIEW.
     */
    @Transactional
    public ReportReviewResponse confirmReport(String username, Long reportId) {
        User owner = resolveOwner(username);
        GeneratedReport report = findReportForOwner(reportId, owner.getBusinessId());

        assertStatusAllows(report, REVIEWABLE_STATUSES,
                "Chỉ có thể xác nhận báo cáo đang ở trạng thái Chờ duyệt");

        LocalDateTime now = LocalDateTime.now();
        report.setStatus(ReportStatus.CONFIRMED);
        report.setReviewedBy(owner.getId());
        report.setReviewedAt(now);
        report.setConfirmedAt(now);

        report = reportRepository.save(report);

        logger.info("Report id={} CONFIRMED by userId={}", reportId, owner.getId());

        return toResponse(report);
    }

    // ──────────────────────────────────────────────────────────────────────
    // REJECT
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Owner rejects the report with a mandatory reason.
     * Only permitted when status is PENDING_REVIEW.
     */
    @Transactional
    public ReportReviewResponse rejectReport(String username,
                                              Long reportId,
                                              ReportRejectRequest request) {
        User owner = resolveOwner(username);
        GeneratedReport report = findReportForOwner(reportId, owner.getBusinessId());

        assertStatusAllows(report, REVIEWABLE_STATUSES,
                "Chỉ có thể từ chối báo cáo đang ở trạng thái Chờ duyệt");

        LocalDateTime now = LocalDateTime.now();
        report.setStatus(ReportStatus.REJECTED);
        report.setRejectionReason(request.getRejectionReason().trim());
        report.setReviewedBy(owner.getId());
        report.setRejectedBy(owner.getId());
        report.setReviewedAt(now);

        report = reportRepository.save(report);

        logger.info("Report id={} REJECTED by userId={}, reason='{}'",
                reportId, owner.getId(), request.getRejectionReason());

        return toResponse(report);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Resolves the authenticated Owner user. Throws 404 if not found.
     */
    private User resolveOwner(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        if (user.getBusinessId() == null) {
            throw new BadRequestException(
                    "Tài khoản chưa được liên kết với hộ kinh doanh nào");
        }

        return user;
    }

    /**
     * Finds a report by ID and verifies it belongs to the given business.
     */
    private GeneratedReport findReportForOwner(Long reportId, Long businessId) {
        return reportRepository.findByIdAndBusinessId(reportId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Báo cáo", "id", reportId));
    }

    /**
     * Guards status-dependent operations.
     */
    private void assertStatusAllows(GeneratedReport report,
                                     Set<ReportStatus> allowedStatuses,
                                     String errorMessage) {
        if (!allowedStatuses.contains(report.getStatus())) {
            throw new BadRequestException(errorMessage);
        }
    }

    /**
     * Maps a {@link GeneratedReport} entity to a {@link ReportReviewResponse}.
     * Resolves template name and type from the linked version → template chain.
     */
    public ReportReviewResponse toResponse(GeneratedReport report) {
        String templateName = null;
        String templateType = null;

        // Resolve template metadata: version → template
        ReportTemplateVersion version = versionRepository
                .findById(report.getTemplateVersionId())
                .orElse(null);

        if (version != null) {
            ReportTemplate template = templateRepository
                    .findById(version.getReportTemplateId())
                    .orElse(null);
            if (template != null) {
                templateName = template.getTemplateName();
                templateType = template.getTemplateType() != null
                        ? template.getTemplateType().name()
                        : null;
            }
        }

        return ReportReviewResponse.builder()
                .id(report.getId())
                .businessId(report.getBusinessId())
                .templateVersionId(report.getTemplateVersionId())
                .templateName(templateName)
                .templateType(templateType)
                .reportingPeriodFrom(report.getReportingPeriodFrom())
                .reportingPeriodTo(report.getReportingPeriodTo())
                .generationNo(report.getGenerationNo())
                .generationMethod(report.getGenerationMethod())
                .reportData(report.getReportData())
                .fileUrl(report.getFileUrl())
                .status(report.getStatus())
                .rejectionReason(report.getRejectionReason())
                .createdBy(report.getCreatedBy())
                .reviewedBy(report.getReviewedBy())
                .editedBy(report.getEditedBy())
                .rejectedBy(report.getRejectedBy())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .reviewedAt(report.getReviewedAt())
                .confirmedAt(report.getConfirmedAt())
                .editedAt(report.getEditedAt())
                .build();
    }
}
