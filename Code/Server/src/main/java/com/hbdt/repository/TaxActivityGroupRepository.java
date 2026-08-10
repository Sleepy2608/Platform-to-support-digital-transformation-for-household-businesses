package com.hbdt.repository;

import com.hbdt.entity.TaxActivityGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaxActivityGroupRepository extends JpaRepository<TaxActivityGroup, Long> {
    Optional<TaxActivityGroup> findByIdAndStatus(Long id, String status);

    List<TaxActivityGroup> findAllByStatusOrderByActivityNameAsc(String status);
}
