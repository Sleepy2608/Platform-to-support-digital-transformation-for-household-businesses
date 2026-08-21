package com.hbdt.repository;

import com.hbdt.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findAllByBusinessIdAndProductIdOrderByCreatedAtDesc(Long businessId, Long productId);
}
