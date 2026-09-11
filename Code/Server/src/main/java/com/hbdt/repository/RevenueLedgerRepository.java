package com.hbdt.repository;

import com.hbdt.entity.RevenueLedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RevenueLedgerRepository extends JpaRepository<RevenueLedgerEntry, Long>, JpaSpecificationExecutor<RevenueLedgerEntry> {

    interface RevenueSummaryProjection {
        BigDecimal getTotalRevenue();
        BigDecimal getTotalQuantity();
        Long getTotalOrders();
        Long getTotalItems();
    }

    boolean existsByBusinessIdAndSalesOrderIdAndStatus(Long businessId, Long salesOrderId, String status);

    List<RevenueLedgerEntry> findAllBySalesOrderId(Long salesOrderId);

    @Modifying
    @Query("""
        UPDATE RevenueLedgerEntry r
        SET r.status = :status, r.updatedAt = :now
        WHERE r.salesOrderId = :salesOrderId
    """)
    int updateStatusBySalesOrderId(
            @Param("salesOrderId") Long salesOrderId,
            @Param("status") String status,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT r FROM RevenueLedgerEntry r
        WHERE r.businessId = :businessId
          AND (:status IS NULL OR r.status = :status)
          AND (:fromDateTime IS NULL OR r.confirmedAt >= :fromDateTime)
          AND (:toDateTime IS NULL OR r.confirmedAt <= :toDateTime)
          AND (:productId IS NULL OR r.productId = :productId)
          AND (
                :keyword IS NULL OR :keyword = ''
                OR LOWER(r.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(r.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    """)
    Page<RevenueLedgerEntry> searchLedger(
            @Param("businessId") Long businessId,
            @Param("status") String status,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime,
            @Param("productId") Long productId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
        SELECT 
            COALESCE(SUM(r.lineTotal), 0) AS totalRevenue,
            COALESCE(SUM(r.quantity), 0) AS totalQuantity,
            COUNT(DISTINCT r.salesOrderId) AS totalOrders,
            COUNT(r.id) AS totalItems
        FROM RevenueLedgerEntry r
        WHERE r.businessId = :businessId
          AND (:status IS NULL OR r.status = :status)
          AND (:fromDateTime IS NULL OR r.confirmedAt >= :fromDateTime)
          AND (:toDateTime IS NULL OR r.confirmedAt <= :toDateTime)
          AND (:productId IS NULL OR r.productId = :productId)
          AND (
                :keyword IS NULL OR :keyword = ''
                OR LOWER(r.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(r.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
    """)
    RevenueSummaryProjection calculateSummary(
            @Param("businessId") Long businessId,
            @Param("status") String status,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime,
            @Param("productId") Long productId,
            @Param("keyword") String keyword
    );

    interface OrderPaymentSummaryProjection {
        BigDecimal getTotalPaid();
        BigDecimal getTotalDebt();
    }

    @Query("""
        SELECT 
            COALESCE(SUM(s.paidAmount), 0) AS totalPaid,
            COALESCE(SUM(s.debtAmount), 0) AS totalDebt
        FROM SalesOrder s
        WHERE s.businessId = :businessId
          AND s.id IN (
              SELECT DISTINCT r.salesOrderId
              FROM RevenueLedgerEntry r
              WHERE r.businessId = :businessId
                AND (:status IS NULL OR r.status = :status)
                AND (:fromDateTime IS NULL OR r.confirmedAt >= :fromDateTime)
                AND (:toDateTime IS NULL OR r.confirmedAt <= :toDateTime)
                AND (:productId IS NULL OR r.productId = :productId)
                AND (
                      :keyword IS NULL OR :keyword = ''
                      OR LOWER(r.orderCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      OR LOWER(r.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      OR LOWER(r.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
          )
    """)
    OrderPaymentSummaryProjection calculateOrderPaymentSummary(
            @Param("businessId") Long businessId,
            @Param("status") String status,
            @Param("fromDateTime") LocalDateTime fromDateTime,
            @Param("toDateTime") LocalDateTime toDateTime,
            @Param("productId") Long productId,
            @Param("keyword") String keyword
    );
}
