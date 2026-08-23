package com.hbdt.repository;

import com.hbdt.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long>, JpaSpecificationExecutor<SalesOrder> {

    boolean existsByBusinessIdAndOrderCodeIgnoreCase(Long businessId, String orderCode);

    boolean existsByBusinessIdAndOrderCode(Long businessId, String orderCode);

    Optional<SalesOrder> findByIdAndBusinessId(Long id, Long businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select salesOrder from SalesOrder salesOrder
            where salesOrder.id = :id and salesOrder.businessId = :businessId
            """)
    Optional<SalesOrder> findForUpdateByIdAndBusinessId(
            @Param("id") Long id,
            @Param("businessId") Long businessId
    );

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
}
