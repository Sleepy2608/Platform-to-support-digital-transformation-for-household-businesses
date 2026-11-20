package com.hbdt.repository;

import com.hbdt.entity.CouponUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    @Query("SELECT u FROM CouponUsage u WHERE u.coupon.id = :couponId ORDER BY u.usedAt DESC")
    List<CouponUsage> findByCouponIdOrderByUsedAtDesc(@Param("couponId") Long couponId);

    @Query("SELECT u FROM CouponUsage u WHERE u.coupon.id = :couponId ORDER BY u.usedAt DESC")
    Page<CouponUsage> findByCouponId(@Param("couponId") Long couponId, Pageable pageable);

    @Query("SELECT COUNT(u) FROM CouponUsage u WHERE u.coupon.id = :couponId")
    long countByCouponId(@Param("couponId") Long couponId);
}
