package com.hbdt.repository;

import com.hbdt.entity.PaymentHistory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
    Optional<PaymentHistory> findByTransactionId(String transactionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentHistory p where p.transactionId = :transactionId")
    Optional<PaymentHistory> findByTransactionIdForUpdate(@Param("transactionId") String transactionId);

    boolean existsBySubscriptionIdAndStatus(Long subscriptionId, String status);
}
