package com.hbdt.repository;

import com.hbdt.entity.TaxObligation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaxObligationRepository extends JpaRepository<TaxObligation, Long> {
    Optional<TaxObligation> findByBusinessIdAndObligationCode(Long businessId, String obligationCode);
}
