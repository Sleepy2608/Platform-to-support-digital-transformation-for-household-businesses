package com.hbdt.repository;

import com.hbdt.entity.ReportTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
