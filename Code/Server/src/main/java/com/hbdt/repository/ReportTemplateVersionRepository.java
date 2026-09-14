package com.hbdt.repository;

import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.enums.VersionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportTemplateVersionRepository
        extends JpaRepository<ReportTemplateVersion, Long> {

    /**
     * Returns all versions for a template, newest first.
     */
    List<ReportTemplateVersion> findByReportTemplateIdOrderByVersionNumberDesc(Long reportTemplateId);

    /**
     * Returns the latest (highest) version for a template — used to
     * determine the next version number on update.
     */
    Optional<ReportTemplateVersion> findTopByReportTemplateIdOrderByVersionNumberDesc(Long reportTemplateId);

    /**
     * Finds versions by status with effectiveFrom on or before a given date.
     * Used by the scheduled activator to find DRAFT versions ready to activate.
     */
    List<ReportTemplateVersion> findByStatusAndEffectiveFromLessThanEqual(VersionStatus status, LocalDate date);

    /**
     * Checks if a version number already exists for a template.
     */
    boolean existsByReportTemplateIdAndVersionNumber(Long reportTemplateId, Integer versionNumber);

    /**
     * Checks if a version with the given effectiveFrom already exists for a template.
     */
    boolean existsByReportTemplateIdAndEffectiveFrom(Long reportTemplateId, LocalDate effectiveFrom);

    /**
     * Finds versions for a template by status.
     */
    List<ReportTemplateVersion> findByReportTemplateIdAndStatus(Long reportTemplateId, VersionStatus status);
}
