package com.hbdt.repository;

import com.hbdt.entity.CouponCheckout;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponCheckoutRepository extends JpaRepository<CouponCheckout, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CouponCheckout c WHERE c.reference = :reference")
    Optional<CouponCheckout> findByReferenceForUpdate(@Param("reference") String reference);

    Optional<CouponCheckout> findByReferenceAndUserId(String reference, Long userId);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("""
            SELECT c FROM CouponCheckout c
            WHERE c.couponId = :couponId AND c.paidAt IS NULL AND c.expiresAt > :now
            """)
    List<CouponCheckout> findReservations(@Param("couponId") Long couponId, @Param("now") LocalDateTime now);

    @Query("SELECT c.couponId FROM CouponCheckout c WHERE c.reference = :reference")
    Optional<Long> findCouponId(@Param("reference") String reference);
}
