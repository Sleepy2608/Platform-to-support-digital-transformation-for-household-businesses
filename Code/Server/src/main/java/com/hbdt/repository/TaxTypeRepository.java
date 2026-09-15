package com.hbdt.repository;

import com.hbdt.entity.TaxType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaxTypeRepository extends JpaRepository<TaxType, Long> {
    Optional<TaxType> findByTaxCodeAndStatus(String taxCode, String status);
    Optional<TaxType> findFirstByTaxCodeIgnoreCase(String taxCode);
}
