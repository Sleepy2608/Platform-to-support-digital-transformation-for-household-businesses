package com.hbdt.repository;

import com.hbdt.entity.GeneratedReport;
import com.hbdt.entity.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface GeneratedReportRepository
        extends JpaRepository<GeneratedReport, Long> {

    /**
     * Paginated list of reports belonging to a specific business.
     */
    Page<GeneratedReport> findByBusinessId(Long businessId, Pageable pageable);

    /**
     * Paginated list of reports filtered by business and status.
     */
    Page<GeneratedReport> findByBusinessIdAndStatus(Long businessId, ReportStatus status, Pageable pageable);

    /**
     * Find a single report by ID and businessId — used for ownership verification.
     */
    Optional<GeneratedReport> findByIdAndBusinessId(Long id, Long businessId);

    /**
     * Search reports by business with optional keyword matching on template name.
     * Joins through template_version → report_template to retrieve template name for search.
     */
    @Query("""
        SELECT gr FROM GeneratedReport gr
        WHERE gr.businessId = :businessId
          AND (:status IS NULL OR gr.status = :status)
        ORDER BY gr.createdAt DESC
        """)
    Page<GeneratedReport> findByBusinessIdFiltered(
            @Param("businessId") Long businessId,
            @Param("status") ReportStatus status,
            Pageable pageable);

    /**
     * Find existing active/reviewable report for a period.
     */
    Optional<GeneratedReport> findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
            Long businessId,
            Long templateVersionId,
            LocalDate reportingPeriodFrom,
            LocalDate reportingPeriodTo,
            Collection<ReportStatus> statuses);

    /**
     * Find the highest generation number for a specific business, template version, and period.
     */
    @Query("""
        SELECT COALESCE(MAX(gr.generationNo), 0)
        FROM GeneratedReport gr
        WHERE gr.businessId = :businessId
          AND gr.templateVersionId = :templateVersionId
          AND gr.reportingPeriodFrom = :from
          AND gr.reportingPeriodTo = :to
        """)
    Integer findMaxGenerationNo(
            @Param("businessId") Long businessId,
            @Param("templateVersionId") Long templateVersionId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
