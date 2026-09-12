package com.hbdt.repository;

import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.enums.DebtTransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface DebtTransactionRepository extends JpaRepository<DebtTransaction, Long> {

    Optional<DebtTransaction> findByIdAndBusinessId(Long id, Long businessId);

    /** Lấy giao dịch ACTIVE theo đơn hàng, sắp xếp mới nhất trước */
    @Query("""
        SELECT dt FROM DebtTransaction dt
        WHERE dt.salesOrderId = :salesOrderId
          AND dt.businessId = :businessId
          AND dt.status = :status
        ORDER BY dt.transactionDate DESC, dt.id DESC
        """)
    List<DebtTransaction> findBySalesOrderIdAndBusinessIdAndStatus(
            @Param("salesOrderId") Long salesOrderId,
            @Param("businessId") Long businessId,
            @Param("status") DebtTransactionStatus status);

    /** Lấy lịch sử giao dịch công nợ theo khách hàng (phân trang) */
    @Query("""
        SELECT dt FROM DebtTransaction dt
        WHERE dt.customerId = :customerId
          AND dt.businessId = :businessId
          AND dt.status = :status
        ORDER BY dt.transactionDate DESC, dt.id DESC
        """)
    Page<DebtTransaction> findByCustomerIdAndBusinessIdAndStatus(
            @Param("customerId") Long customerId,
            @Param("businessId") Long businessId,
            @Param("status") DebtTransactionStatus status,
            Pageable pageable);

    /** Tính tổng amount của các giao dịch ACTIVE theo loại, đơn hàng */
    @Query("""
        SELECT COALESCE(SUM(dt.amount), 0)
        FROM DebtTransaction dt
        WHERE dt.salesOrderId = :salesOrderId
          AND dt.businessId = :businessId
          AND dt.transactionType = :transactionType
          AND dt.status = 'ACTIVE'
        """)
    BigDecimal sumAmountBySalesOrderIdAndType(
            @Param("salesOrderId") Long salesOrderId,
            @Param("businessId") Long businessId,
            @Param("transactionType") String transactionType);

    /** Tính tổng amount ACTIVE theo khách hàng và loại giao dịch */
    @Query("""
        SELECT COALESCE(SUM(dt.amount), 0)
        FROM DebtTransaction dt
        WHERE dt.customerId = :customerId
          AND dt.businessId = :businessId
          AND dt.transactionType = :transactionType
          AND dt.status = 'ACTIVE'
        """)
    BigDecimal sumAmountByCustomerIdAndType(
            @Param("customerId") Long customerId,
            @Param("businessId") Long businessId,
            @Param("transactionType") String transactionType);

    /** Tính dư nợ hiện tại từ sổ giao dịch ACTIVE (nguồn dữ liệu chuẩn). */
    @Query("""
        SELECT COALESCE(SUM(
            CASE
                WHEN dt.transactionType = 'DEBT_INCREASE' THEN dt.amount
                WHEN dt.transactionType IN ('PAYMENT', 'VOID') THEN -dt.amount
                ELSE 0
            END
        ), 0)
        FROM DebtTransaction dt
        WHERE dt.customerId = :customerId
          AND dt.businessId = :businessId
          AND dt.status = 'ACTIVE'
        """)
    BigDecimal calculateCurrentBalance(
            @Param("customerId") Long customerId,
            @Param("businessId") Long businessId);

    /** Đếm giao dịch theo salesOrderId (dùng để sinh transaction_code) */
    long countBySalesOrderId(Long salesOrderId);

    boolean existsBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
            Long salesOrderId, Long businessId, String transactionType, DebtTransactionStatus status);

    Optional<DebtTransaction> findBySalesOrderIdAndBusinessIdAndTransactionTypeAndStatus(
            Long salesOrderId, Long businessId, String transactionType, DebtTransactionStatus status);

    Optional<DebtTransaction> findByBusinessIdAndTransactionCode(Long businessId, String transactionCode);
}
