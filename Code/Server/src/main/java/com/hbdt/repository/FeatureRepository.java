package com.hbdt.repository;

import com.hbdt.entity.Feature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeatureRepository extends JpaRepository<Feature, Long> {

    Optional<Feature> findByFeatureCode(String featureCode);

    Optional<Feature> findByFeatureCodeIgnoreCase(String featureCode);

    List<Feature> findAllByStatus(String status);

    List<Feature> findAllByOrderByFeatureCodeAsc();

    boolean existsByFeatureCodeIgnoreCase(String featureCode);

    boolean existsByFeatureCodeIgnoreCaseAndIdNot(String featureCode, Long id);
}
