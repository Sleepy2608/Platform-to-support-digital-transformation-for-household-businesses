package com.hbdt.repository;

import com.hbdt.entity.InventoryAlert;
import com.hbdt.entity.enums.InventoryAlertStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryAlertRepository extends JpaRepository<InventoryAlert, Long> {

    List<InventoryAlert> findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
            Long businessId, InventoryAlertStatus status);

    List<InventoryAlert> findAllByBusinessIdOrderByTriggeredAtDesc(Long businessId);

    long countByBusinessIdAndStatus(Long businessId, InventoryAlertStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select alert from InventoryAlert alert
            where alert.businessId = :businessId
              and alert.productId = :productId
              and alert.status = com.hbdt.entity.enums.InventoryAlertStatus.ACTIVE
            order by alert.id desc
            """)
    List<InventoryAlert> findActiveForUpdate(
            @Param("businessId") Long businessId,
            @Param("productId") Long productId);

    Optional<InventoryAlert> findFirstByBusinessIdAndProductIdAndStatusOrderByIdDesc(
            Long businessId, Long productId, InventoryAlertStatus status);
}
