package com.hbdt.repository;

import com.hbdt.entity.GeneratedReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeneratedReportRepository
        extends JpaRepository<GeneratedReport, Long> {
}
