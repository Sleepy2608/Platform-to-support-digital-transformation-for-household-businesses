package com.hbdt.repository;

import com.hbdt.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findTopByBusinessIdAndStatusOrderByCreatedAtDesc(Long businessId, String status);
}
