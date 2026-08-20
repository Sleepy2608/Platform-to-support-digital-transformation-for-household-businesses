package com.hbdt.repository;

import com.hbdt.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    boolean existsByBusinessIdAndOrderCodeIgnoreCase(Long businessId, String orderCode);

    Optional<SalesOrder> findByIdAndBusinessId(Long id, Long businessId);
}
