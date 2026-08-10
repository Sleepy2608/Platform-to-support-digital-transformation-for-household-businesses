package com.hbdt.repository;

import com.hbdt.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {
    Optional<Category> findByIdAndBusinessId(Long id, Long businessId);

    boolean existsByBusinessIdAndCategoryCodeIgnoreCase(Long businessId, String categoryCode);

    boolean existsByBusinessIdAndCategoryCodeIgnoreCaseAndIdNot(Long businessId, String categoryCode, Long id);

    boolean existsByBusinessIdAndCategoryNameIgnoreCase(Long businessId, String categoryName);

    boolean existsByBusinessIdAndCategoryNameIgnoreCaseAndIdNot(Long businessId, String categoryName, Long id);
}
