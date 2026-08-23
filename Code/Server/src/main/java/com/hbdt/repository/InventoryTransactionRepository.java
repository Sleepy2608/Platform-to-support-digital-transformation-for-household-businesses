package com.hbdt.repository;

import com.hbdt.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findAllByBusinessIdAndProductIdOrderByCreatedAtDesc(
            Long businessId,
            Long productId
    );

    Optional<InventoryTransaction>
    findFirstByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndQuantityChangeLessThanOrderByIdDesc(
            Long businessId,
            Long productId,
            String referenceType,
            Long referenceId,
            BigDecimal quantityChange
    );
}
