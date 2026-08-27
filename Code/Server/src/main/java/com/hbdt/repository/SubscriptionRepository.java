package com.hbdt.repository;

import com.hbdt.entity.Subscription;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    // Query subscription hiện tại của Owner (mới nhất theo ngày tạo/ngày bắt đầu)
    Optional<Subscription> findTopByOwnerOrderByCreatedAtDesc(User owner);

    Optional<Subscription> findTopByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    // Query các subscription ACTIVE
    List<Subscription> findAllByStatus(SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.status = :status OR (s.endDate IS NOT NULL AND s.endDate < :today)")
    List<Subscription> findAllExpired(@Param("status") SubscriptionStatus status, @Param("today") LocalDateTime today);

    // Hỗ trợ query cho service hiện tại
    Optional<Subscription> findTopByOwnerIdAndStatusOrderByCreatedAtDesc(Long ownerId, SubscriptionStatus status);
}
