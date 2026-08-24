package com.hbdt.repository;

import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    boolean existsByBusinessIdAndOrderCodeIgnoreCase(Long businessId, String orderCode);

    boolean existsByBusinessIdAndOrderCode(Long businessId, String orderCode);

    Optional<SalesOrder> findByIdAndBusinessId(Long id, Long businessId);

    List<SalesOrder> findByCustomerIdAndBusinessId(Long customerId, Long businessId);

    Page<SalesOrder> findAllByBusinessIdOrderByCreatedAtDesc(Long businessId, Pageable pageable);

    @Query("""
        select salesOrder from SalesOrder salesOrder
        where salesOrder.businessId = :businessId
          and (:keyword is null or lower(salesOrder.orderCode) like lower(concat('%', :keyword, '%')))
          and (:status is null or salesOrder.status = :status)
          and (:source is null or salesOrder.source = :source)
        """)
    Page<SalesOrder> searchByBusiness(
            @Param("businessId") Long businessId,
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("source") String source,
            Pageable pageable
    );

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
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select salesOrder from SalesOrder salesOrder
            where salesOrder.id = :id and salesOrder.businessId = :businessId
            """)
    Optional<SalesOrder> findForUpdateByIdAndBusinessId(
            @Param("id") Long id,
            @Param("businessId") Long businessId
    );
}
