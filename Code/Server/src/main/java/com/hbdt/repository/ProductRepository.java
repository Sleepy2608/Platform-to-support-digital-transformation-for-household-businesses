package com.hbdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.hbdt.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findByIdAndBusinessId(Long id, Long businessId);

    boolean existsByBusinessIdAndProductCodeIgnoreCase(Long businessId, String productCode);

    boolean existsByBusinessIdAndProductCodeIgnoreCaseAndIdNot(Long businessId, String productCode, Long id);

    boolean existsByBusinessIdAndProductNameIgnoreCase(Long businessId, String productName);

    boolean existsByBusinessIdAndProductNameIgnoreCaseAndIdNot(Long businessId, String productName, Long id);

    long countByBusinessId(Long businessId);

    List<Product> findAllByBusinessIdOrderByProductNameAsc(Long businessId);

    List<Product> findAllByBusinessIdAndStatusOrderByProductNameAsc(Long businessId, String status);
}
