package com.hbdt.repository;

import com.hbdt.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {
    List<SalesOrderItem> findAllBySalesOrderIdOrderByIdAsc(Long salesOrderId);
}
