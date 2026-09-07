package com.hbdt.repository;

import com.hbdt.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByIdAndBusinessId(Long id, Long businessId);

    Optional<Customer> findByIdAndBusinessIdAndStatus(Long id, Long businessId, String status);

    boolean existsByBusinessIdAndCustomerCodeIgnoreCase(Long businessId, String customerCode);

    // ===== Phone uniqueness checks (HBDT-47) =====

    /** Check trùng phone khi tạo mới */
    boolean existsByBusinessIdAndPhone(Long businessId, String phone);

    /** Check trùng phone khi cập nhật (loại trừ chính customer đó) */
    boolean existsByBusinessIdAndPhoneAndIdNot(Long businessId, String phone, Long id);

    // ===== Search & Filter (HBDT-47) =====

    /** Tìm kiếm + lọc theo status + phân trang, scoped theo businessId */
    @Query("""
        SELECT c FROM Customer c
        WHERE c.businessId = :businessId
          AND (:status IS NULL OR c.status = :status)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(c.customerName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR c.phone LIKE CONCAT('%', :keyword, '%'))
        ORDER BY c.createdAt DESC
        """)
    Page<Customer> findByBusinessIdWithFilters(
            @Param("businessId") Long businessId,
            @Param("keyword") String keyword,
            @Param("status") String status,
            Pageable pageable);

    // ===== Existing queries (preserved) =====

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

