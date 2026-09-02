package com.hbdt.repository;

import com.hbdt.entity.BusinessProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, Long> {

    boolean existsByTaxCode(String taxCode);

    boolean existsByTaxCodeAndIdNot(String taxCode, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from BusinessProfile b where b.id = :id")
    Optional<BusinessProfile> findByIdForUpdate(@Param("id") Long id);
}
