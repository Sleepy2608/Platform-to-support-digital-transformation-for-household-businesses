package com.hbdt.repository;

import com.hbdt.entity.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {
    boolean existsByTemplateCodeIgnoreCase(String code);
    List<ReportTemplate> findAllByOrderByTemplateCodeAsc();
}
