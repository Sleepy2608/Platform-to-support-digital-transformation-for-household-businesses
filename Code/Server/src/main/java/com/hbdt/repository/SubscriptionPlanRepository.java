package com.hbdt.repository;

import com.hbdt.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    Optional<SubscriptionPlan> findByPlanCodeAndStatus(String planCode, String status);

    Optional<SubscriptionPlan> findByPlanCodeIgnoreCaseAndStatus(String planCode, String status);

    boolean existsByPlanCodeIgnoreCase(String planCode);

    boolean existsByPlanCodeIgnoreCaseAndIdNot(String planCode, Long id);

    List<SubscriptionPlan> findAllByStatusOrderByMonthlyPriceAsc(String status);
}
