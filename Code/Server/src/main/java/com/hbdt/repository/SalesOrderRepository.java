package com.hbdt.repository;

import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

    Optional<SalesOrder> findByIdAndBusinessId(Long id, Long businessId);

    List<SalesOrder> findByCustomerIdAndBusinessId(Long customerId, Long businessId);

    Page<SalesOrder> findByBusinessId(Long businessId, Pageable pageable);

    @Query("""
        SELECT o FROM SalesOrder o
        WHERE o.businessId = :businessId
          AND o.paymentStatus = :paymentStatus
        ORDER BY o.createdAt DESC
        """)
    Page<SalesOrder> findByBusinessIdAndPaymentStatus(
            @Param("businessId") Long businessId,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            Pageable pageable);

    @Query("""
        SELECT o FROM SalesOrder o
        WHERE o.businessId = :businessId
          AND o.customerId = :customerId
        ORDER BY o.createdAt DESC
        """)
    Page<SalesOrder> findByBusinessIdAndCustomerId(
            @Param("businessId") Long businessId,
            @Param("customerId") Long customerId,
            Pageable pageable);
}
