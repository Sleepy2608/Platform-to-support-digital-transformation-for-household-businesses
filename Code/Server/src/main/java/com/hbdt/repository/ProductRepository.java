package com.hbdt.repository;

import com.hbdt.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findByIdAndBusinessId(Long id, Long businessId);

    boolean existsByBusinessIdAndProductCodeIgnoreCase(Long businessId, String productCode);

    boolean existsByBusinessIdAndProductCodeIgnoreCaseAndIdNot(Long businessId, String productCode, Long id);

    boolean existsByBusinessIdAndProductNameIgnoreCase(Long businessId, String productName);

    boolean existsByBusinessIdAndProductNameIgnoreCaseAndIdNot(Long businessId, String productName, Long id);

    List<Product> findAllByBusinessIdOrderByProductNameAsc(Long businessId);
}
