package com.hbdt.repository;

import com.hbdt.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findTopByBusinessIdAndStatusOrderByCreatedAtDesc(Long businessId, String status);

    /** Lấy subscription mới nhất của business (bất kể status). */
    Optional<Subscription> findTopByBusinessIdOrderByCreatedAtDesc(Long businessId);

    /** Tìm tất cả subscription theo status — phục vụ lifecycle management. */
    List<Subscription> findAllByStatus(String status);

    /** Tìm subscription ACTIVE đã hết hạn — phục vụ scheduled expiry job. */
    List<Subscription> findAllByEndDateBeforeAndStatus(LocalDate date, String status);

    /** Tìm tất cả subscription của một business — phục vụ upgrade/downgrade. */
    List<Subscription> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId);
}
