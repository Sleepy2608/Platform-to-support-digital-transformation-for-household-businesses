package com.hbdt.repository;

import com.hbdt.entity.ServiceInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceInvoiceRepository extends JpaRepository<ServiceInvoice, Long> {
}
