package com.hbdt.repository;

import com.hbdt.entity.StockImport;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

public interface StockImportRepository extends JpaRepository<StockImport, Long> {

    Optional<StockImport> findByIdAndBusinessId(Long id, Long businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StockImport s WHERE s.id = :id AND s.businessId = :businessId")
    Optional<StockImport> findForUpdateByIdAndBusinessId(@Param("id") Long id, @Param("businessId") Long businessId);

    Page<StockImport> findAllByBusinessIdOrderByImportDateDesc(Long businessId, Pageable pageable);

    @Query("SELECT s FROM StockImport s WHERE s.businessId = :businessId AND s.importCode LIKE %:keyword% ORDER BY s.importDate DESC")
    Page<StockImport> searchByBusinessIdAndKeyword(Long businessId, String keyword, Pageable pageable);

    long countByBusinessId(Long businessId);

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM StockImport s
        WHERE s.businessId = :businessId
          AND s.status = 'CONFIRMED'
          AND (:fromDateTime IS NULL OR s.importDate >= :fromDateTime)
          AND (:toDateTime IS NULL OR s.importDate <= :toDateTime)
    """)
    BigDecimal calculateTotalImportCost(
            @Param("businessId") Long businessId,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime
    );

    @Query("""
        SELECT s FROM StockImport s
        WHERE s.businessId = :businessId
          AND s.status = 'CONFIRMED'
          AND (:fromDateTime IS NULL OR s.importDate >= :fromDateTime)
          AND (:toDateTime IS NULL OR s.importDate <= :toDateTime)
          AND (:keyword IS NULL OR :keyword = '' OR LOWER(s.importCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<StockImport> searchConfirmedStockImports(
            @Param("businessId") Long businessId,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
