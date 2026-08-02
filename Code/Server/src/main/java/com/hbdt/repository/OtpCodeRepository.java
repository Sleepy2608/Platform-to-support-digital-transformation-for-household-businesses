package com.hbdt.repository;

import com.hbdt.entity.OtpCode;
import com.hbdt.entity.enums.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    /**
     * Find the latest unused, non-expired OTP for a given user and type.
     */
    Optional<OtpCode> findTopByUserIdAndTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            Long userId, OtpType type, LocalDateTime now);

    /**
     * Find OTP by target (email/phone), type, code, not yet used and not expired.
     */
    Optional<OtpCode> findTopByTargetAndTypeAndCodeAndUsedFalseAndExpiresAtAfter(
            String target, OtpType type, String code, LocalDateTime now);

    /**
     * Invalidate all existing OTPs for a user+type pair (before issuing a new one).
     */
    @Modifying
    @Query("UPDATE OtpCode o SET o.used = true WHERE o.userId = :userId AND o.type = :type AND o.used = false")
    void invalidateAllByUserIdAndType(@Param("userId") Long userId, @Param("type") OtpType type);

    /**
     * Clean up expired OTP records (called by scheduled task).
     */
    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :threshold")
    void deleteExpiredBefore(@Param("threshold") LocalDateTime threshold);
}
