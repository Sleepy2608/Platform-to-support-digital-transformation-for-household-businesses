package com.hbdt.repository;

import com.hbdt.entity.Coupon;
import com.hbdt.entity.enums.CouponStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Query("SELECT b FROM Coupon b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    Optional<Coupon> findByKeyCode(@Param("keyCode") String keyCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Coupon b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    Optional<Coupon> findByKeyCodeForUpdate(@Param("keyCode") String keyCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT COUNT(b) > 0 FROM Coupon b WHERE LOWER(b.keyCode) = LOWER(:keyCode)")
    boolean existsByKeyCode(@Param("keyCode") String keyCode);

    @Query("SELECT b FROM Coupon b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(b.keyCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(b.note) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Coupon> searchCoupons(@Param("keyword") String keyword,
                                     @Param("status") CouponStatus status,
                                     Pageable pageable);

    long countByStatus(CouponStatus status);

    @Query("SELECT COALESCE(SUM(b.usedCount), 0) FROM Coupon b")
    long sumTotalUsedCount();
}
