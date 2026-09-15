package com.hbdt.repository;

import com.hbdt.entity.TaxPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface TaxPaymentRepository extends JpaRepository<TaxPayment, Long> {
    @Query("select coalesce(sum(p.paymentAmount), 0) from TaxPayment p where p.taxObligationId = :obligationId")
    BigDecimal sumPaidByObligationId(@Param("obligationId") Long obligationId);
}
