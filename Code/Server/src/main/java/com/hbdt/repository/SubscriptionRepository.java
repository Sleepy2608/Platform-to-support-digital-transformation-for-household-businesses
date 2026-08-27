package com.hbdt.repository;

import com.hbdt.entity.Subscription;
import com.hbdt.entity.enums.SubscriptionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Subscription s where s.id = :id")
    Optional<Subscription> findByIdForUpdate(@Param("id") Long id);

    Optional<Subscription> findTopByBusinessIdOrderByCreatedAtDesc(Long businessId);

    Optional<Subscription> findTopByBusinessIdAndStatusOrderByCreatedAtDesc(
            Long businessId, SubscriptionStatus status);

    List<Subscription> findAllByStatus(SubscriptionStatus status);

    List<Subscription> findAllByStatusAndEndDateBefore(SubscriptionStatus status, LocalDate today);

    boolean existsByBusinessIdAndStatusIn(Long businessId, Collection<SubscriptionStatus> statuses);
}
