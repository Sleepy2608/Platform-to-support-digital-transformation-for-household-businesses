package com.hbdt.repository;

import com.hbdt.entity.DebtTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DebtTransactionRepository extends JpaRepository<DebtTransaction, Long> {
    Optional<DebtTransaction> findFirstByBusinessIdAndCustomerIdOrderByIdDesc(Long businessId, Long customerId);
}
