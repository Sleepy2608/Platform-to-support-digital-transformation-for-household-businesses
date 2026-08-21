package com.hbdt.repository;

import com.hbdt.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {
    Optional<SalesOrder> findByIdAndBusinessId(Long id, Long businessId);

    Page<SalesOrder> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId, Pageable pageable);

    boolean existsByBusinessIdAndOrderCode(Long businessId, String orderCode);
}
