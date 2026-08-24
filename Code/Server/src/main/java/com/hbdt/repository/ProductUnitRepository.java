package com.hbdt.repository;

import com.hbdt.entity.ProductUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductUnitRepository extends JpaRepository<ProductUnit,Long> {
    List<ProductUnit> findAllByProductId(Long productId);

    List<ProductUnit> findAllByProductIdAndStatusOrderByBaseUnitDesc(Long productId, String status);

    Optional<ProductUnit> findByIdAndProductId(Long id, Long productId);

    Optional<ProductUnit> findByProductIdAndUnitId(Long productId, Long unitId);

    Optional<ProductUnit> findByProductIdAndUnitIdAndStatus(Long productId, Long unitId, String status);
}
