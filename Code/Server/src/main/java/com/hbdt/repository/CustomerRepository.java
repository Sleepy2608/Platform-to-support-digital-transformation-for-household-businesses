package com.hbdt.repository;

import com.hbdt.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByIdAndBusinessIdAndStatus(Long id, Long businessId, String status);

    boolean existsByBusinessIdAndCustomerCodeIgnoreCase(Long businessId, String customerCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select customer from Customer customer
            where customer.id = :id and customer.businessId = :businessId and customer.status = 'ACTIVE'
            """)
    Optional<Customer> findActiveForUpdate(@Param("id") Long id, @Param("businessId") Long businessId);

    @Query("""
            select customer from Customer customer
            where customer.businessId = :businessId and customer.status = 'ACTIVE'
              and (:keyword is null
                   or lower(customer.customerName) like lower(concat('%', :keyword, '%'))
                   or lower(customer.customerCode) like lower(concat('%', :keyword, '%'))
                   or customer.phone like concat('%', :keyword, '%'))
            order by customer.customerName asc
            """)
    Page<Customer> searchActive(
            @Param("businessId") Long businessId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
