package com.hbdt.repository;

import com.hbdt.entity.ProductUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductUnitRepository extends JpaRepository<ProductUnit,Long> {
    List<ProductUnit> findAllByProductIdAndStatus(Long productId,String status);
    Optional<ProductUnit> findAllByIdAndProductId(Long Id,Long productId);
    Optional<ProductUnit> findAllByProductIdAndUnitId(Long productId,Long unitId);
    Optional<ProductUnit> findAllByProductIdAndUnitIdAndStatus(Long productId,Long unitId,String status);
}
