package com.hbdt.repository;

import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportTemplateRepository
        extends JpaRepository<ReportTemplate, Long>,
                JpaSpecificationExecutor<ReportTemplate> {

    boolean existsByTemplateCode(String templateCode);

    Optional<ReportTemplate> findByTemplateTypeAndStatus(TemplateType type, TemplateStatus status);
}
