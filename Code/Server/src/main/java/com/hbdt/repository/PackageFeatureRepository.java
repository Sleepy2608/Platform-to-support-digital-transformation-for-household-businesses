package com.hbdt.repository;

import com.hbdt.entity.PackageFeature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PackageFeatureRepository extends JpaRepository<PackageFeature, Long> {

    List<PackageFeature> findAllByPlanId(Long planId);

    List<PackageFeature> findAllByPlanIdAndEnabledTrue(Long planId);

    Optional<PackageFeature> findByPlanIdAndFeatureFeatureCode(Long planId, String featureCode);

    Optional<PackageFeature> findByPlanIdAndFeatureId(Long planId, Long featureId);

    boolean existsByPlanIdAndFeatureId(Long planId, Long featureId);

    void deleteByPlanIdAndFeatureId(Long planId, Long featureId);

    void deleteAllByFeatureId(Long featureId);
}
