package com.hbdt.repository;

import com.hbdt.entity.BypassKeyUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BypassKeyUsageRepository extends JpaRepository<BypassKeyUsage, Long> {

    @Query("SELECT u FROM BypassKeyUsage u WHERE u.bypassKey.id = :bypassKeyId ORDER BY u.usedAt DESC")
    List<BypassKeyUsage> findByBypassKeyIdOrderByUsedAtDesc(@Param("bypassKeyId") Long bypassKeyId);

    @Query("SELECT u FROM BypassKeyUsage u WHERE u.bypassKey.id = :bypassKeyId ORDER BY u.usedAt DESC")
    Page<BypassKeyUsage> findByBypassKeyId(@Param("bypassKeyId") Long bypassKeyId, Pageable pageable);

    @Query("SELECT COUNT(u) FROM BypassKeyUsage u WHERE u.bypassKey.id = :bypassKeyId")
    long countByBypassKeyId(@Param("bypassKeyId") Long bypassKeyId);
}

