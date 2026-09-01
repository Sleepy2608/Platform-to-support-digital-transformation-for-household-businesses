package com.hbdt.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hbdt.entity.Subscription;
import com.hbdt.entity.enums.SubscriptionStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /** Lấy subscription mới nhất của business (bất kể status). */
    Optional<Subscription> findTopByBusinessIdOrderByCreatedAtDesc(Long businessId);

    /** Tìm tất cả subscription của một business — phục vụ upgrade/downgrade. */
    List<Subscription> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Subscription s where s.id = :id")
    Optional<Subscription> findByIdForUpdate(@Param("id") Long id);

    Optional<Subscription> findTopByBusinessIdAndStatusOrderByCreatedAtDesc(
            Long businessId, SubscriptionStatus status);

    List<Subscription> findAllByStatus(SubscriptionStatus status);

    List<Subscription> findAllByEndDateBeforeAndStatus(LocalDate date, SubscriptionStatus status);

    List<Subscription> findAllByStatusAndEndDateBefore(SubscriptionStatus status, LocalDate today);

    boolean existsByBusinessIdAndStatusIn(Long businessId, Collection<SubscriptionStatus> statuses);
}
