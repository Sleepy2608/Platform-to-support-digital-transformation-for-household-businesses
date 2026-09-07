package com.hbdt.repository;

import com.hbdt.entity.ServiceInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ServiceInvoiceRepository extends JpaRepository<ServiceInvoice, Long>, JpaSpecificationExecutor<ServiceInvoice> {
    Optional<ServiceInvoice> findByInvoiceCode(String invoiceCode);
    List<ServiceInvoice> findByUserId(Long userId);
    List<ServiceInvoice> findBySubscriptionId(Long subscriptionId);
}
