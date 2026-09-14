package com.hbdt.repository;

import com.hbdt.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long>, JpaSpecificationExecutor<InventoryTransaction> {
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

    boolean existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
            Long businessId,
            Long productId,
            String referenceType,
            Long referenceId,
            String transactionType
    );

    Optional<InventoryTransaction> findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
            Long businessId,
            Long productId,
            LocalDateTime startDate
    );

    List<InventoryTransaction> findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
            Long businessId,
            Long productId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    List<InventoryTransaction> findByBusinessIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
            Long businessId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );
}
