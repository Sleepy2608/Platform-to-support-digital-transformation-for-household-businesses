package com.hbdt.repository;

import com.hbdt.entity.StockImport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface StockImportRepository extends JpaRepository<StockImport, Long> {

    Optional<StockImport> findByIdAndBusinessId(Long id, Long businessId);

    Page<StockImport> findAllByBusinessIdOrderByImportDateDesc(Long businessId, Pageable pageable);

    @Query("SELECT s FROM StockImport s WHERE s.businessId = :businessId AND s.importCode LIKE %:keyword% ORDER BY s.importDate DESC")
    Page<StockImport> searchByBusinessIdAndKeyword(Long businessId, String keyword, Pageable pageable);

    long countByBusinessId(Long businessId);
}
