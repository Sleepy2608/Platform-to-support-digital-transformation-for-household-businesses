package com.hbdt.repository;

import com.hbdt.entity.BypassKey;
import com.hbdt.entity.enums.BypassKeyStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BypassKeyRepository extends JpaRepository<BypassKey, Long> {

    @Query("SELECT b FROM BypassKey b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    Optional<BypassKey> findByKeyCode(@Param("keyCode") String keyCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM BypassKey b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    Optional<BypassKey> findByKeyCodeForUpdate(@Param("keyCode") String keyCode);

    @Query("SELECT COUNT(b) > 0 FROM BypassKey b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    boolean existsByKeyCode(@Param("keyCode") String keyCode);

    @Query("SELECT b FROM BypassKey b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(b.keyCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.note) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<BypassKey> searchBypassKeys(@Param("keyword") String keyword,
                                     @Param("status") BypassKeyStatus status,
                                     Pageable pageable);

    long countByStatus(BypassKeyStatus status);

    @Query("SELECT COALESCE(SUM(b.usedCount), 0) FROM BypassKey b")
    long sumTotalUsedCount();
}

