package com.hbdt.repository;

import com.hbdt.entity.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {
    Optional<InventoryBalance> findByBusinessIdAndProductId(Long businessId, Long productId);
}
