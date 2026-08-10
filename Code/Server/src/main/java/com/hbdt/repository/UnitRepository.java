package com.hbdt.repository;

import com.hbdt.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UnitRepository extends JpaRepository<Unit, Long> {
    Optional<Unit> findByIdAndStatus(Long id, String status);

    List<Unit> findAllByStatusOrderByUnitNameAsc(String status);
}
