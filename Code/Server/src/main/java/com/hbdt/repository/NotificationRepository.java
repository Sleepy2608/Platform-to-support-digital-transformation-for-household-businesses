package com.hbdt.repository;

import com.hbdt.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop100ByBusinessIdAndUserIdOrderByCreatedAtDesc(
            Long businessId, Long userId);

    List<Notification> findTop100ByBusinessIdAndUserIdAndReadFalseOrderByCreatedAtDesc(
            Long businessId, Long userId);

    long countByBusinessIdAndUserIdAndReadFalse(Long businessId, Long userId);

    Optional<Notification> findByIdAndBusinessIdAndUserId(
            Long id, Long businessId, Long userId);
}
