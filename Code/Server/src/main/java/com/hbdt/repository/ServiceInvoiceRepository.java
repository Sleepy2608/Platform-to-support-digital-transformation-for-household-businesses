package com.hbdt.repository;

import com.hbdt.entity.ServiceInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ServiceInvoiceRepository extends JpaRepository<ServiceInvoice, Long>, JpaSpecificationExecutor<ServiceInvoice> {
    Optional<ServiceInvoice> findByInvoiceCode(String invoiceCode);
    List<ServiceInvoice> findByUserId(Long userId);
    List<ServiceInvoice> findBySubscriptionId(Long subscriptionId);
    boolean existsBySubscriptionIdAndStatus(Long subscriptionId, String status);

    @EntityGraph(attributePaths = {"user", "subscription", "plan"})
    Optional<ServiceInvoice> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"user", "subscription", "plan"})
    @Query("SELECT s FROM ServiceInvoice s ORDER BY s.createdAt DESC")
    List<ServiceInvoice> findAllWithDetails();

    @EntityGraph(attributePaths = {"user", "subscription", "plan"})
    @Query("SELECT s FROM ServiceInvoice s WHERE (:status IS NULL OR s.status = :status) AND (:startDate IS NULL OR s.createdAt >= :startDate) AND (:endDate IS NULL OR s.createdAt < :endDate) ORDER BY s.createdAt DESC")
    List<ServiceInvoice> findAllWithDetailsAndFilters(@Param("status") String status, @Param("startDate") java.time.LocalDateTime startDate, @Param("endDate") java.time.LocalDateTime endDate);
}
