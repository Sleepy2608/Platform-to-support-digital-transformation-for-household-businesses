package com.hbdt.repository;

import com.hbdt.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByIdAndBusinessId(Long id, Long businessId);

    @Query("""
        SELECT c FROM Customer c
        WHERE c.businessId = :businessId
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(c.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR c.phone LIKE CONCAT('%', :keyword, '%'))
        ORDER BY c.createdAt DESC
        """)
    Page<Customer> findByBusinessId(
            @Param("businessId") Long businessId,
            @Param("keyword") String keyword,
            Pageable pageable);
}
