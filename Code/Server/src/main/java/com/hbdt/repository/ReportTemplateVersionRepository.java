package com.hbdt.repository;

import com.hbdt.entity.ReportTemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportTemplateVersionRepository extends JpaRepository<ReportTemplateVersion, Long> {
    boolean existsByReportTemplateIdAndVersionNumber(Long templateId, String version);
    List<ReportTemplateVersion> findAllByReportTemplateIdOrderByEffectiveFromDesc(Long templateId);
}
