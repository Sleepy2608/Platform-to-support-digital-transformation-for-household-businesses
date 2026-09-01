package com.hbdt.repository;

import com.hbdt.entity.InventoryBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {
    Optional<InventoryBalance> findByBusinessIdAndProductId(Long businessId, Long productId);

    List<InventoryBalance> findAllByBusinessId(Long businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select balance from InventoryBalance balance
            where balance.businessId = :businessId and balance.productId = :productId
            """)
    Optional<InventoryBalance> findForUpdate(
            @Param("businessId") Long businessId,
            @Param("productId") Long productId
    );
}
