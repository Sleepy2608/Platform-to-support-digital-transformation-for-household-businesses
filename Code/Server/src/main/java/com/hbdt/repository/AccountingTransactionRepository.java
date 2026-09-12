package com.hbdt.repository;

import com.hbdt.entity.AccountingTransaction;
import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.AccountingTransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository cho {@link AccountingTransaction} -- HBDT-59 Automatic Sales Bookkeeping.
 *
 * <h3>Idempotency pattern:</h3>
 * <pre>{@code
 * if (!repo.existsByOrderId(orderId)) {
 *     repo.save(transaction);
 * }
 * }</pre>
 * Ket hop voi UNIQUE index tren {@code order_id} o tang DB,
 * dam bao khong co but toan trung du service duoc goi dong thoi.
 */
@Repository
public interface AccountingTransactionRepository extends JpaRepository<AccountingTransaction, Long> {

    // -------------------------------------------------------------------------
    // Idempotency checks
    // -------------------------------------------------------------------------

    /**
     * Kiem tra xem don hang da duoc ghi so chua.
     * Dung truoc khi insert de tranh duplicate (fast-path check).
     *
     * @param orderId ID cua SalesOrder
     * @return {@code true} neu but toan da ton tai
     */
    boolean existsByOrderId(Long orderId);

    /**
     * Lay but toan ke toan theo don hang.
     * Dung khi can kiem tra hoac dao but toan (RETURN).
     *
     * @param orderId ID cua SalesOrder
     * @return but toan neu ton tai
     */
    Optional<AccountingTransaction> findByOrderId(Long orderId);

    // -------------------------------------------------------------------------
    // Danh sach giao dich (phan trang)
    // -------------------------------------------------------------------------

    /**
     * Lay danh sach but toan cua mot ho kinh doanh trong khoang thoi gian,
     * sap xep moi nhat truoc. Dung cho trang lich su giao dich ke toan.
     *
     * @param businessId ID ho kinh doanh
     * @param status     trang thai loc (VD: COMPLETED)
     * @param startDate  dau ky (inclusive)
     * @param endDate    cuoi ky (inclusive)
     * @param pageable   phan trang
     */
    @Query("""
        SELECT t FROM AccountingTransaction t
        WHERE t.businessId = :businessId
          AND t.status = :status
          AND (CAST(:startDate AS timestamp) IS NULL OR t.createdAt >= :startDate)
          AND (CAST(:endDate AS timestamp) IS NULL OR t.createdAt <= :endDate)
        ORDER BY t.createdAt DESC
        """)
    Page<AccountingTransaction> findByBusinessIdAndStatusAndCreatedAtBetween(
            @Param("businessId") Long businessId,
            @Param("status") AccountingTransactionStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // -------------------------------------------------------------------------
    // Tong hop doanh thu theo ky
    // -------------------------------------------------------------------------

    /**
     * Tong doanh thu (totalAmount) cua cac giao dich COMPLETED trong ky.
     */
    @Query("""
        SELECT COALESCE(SUM(t.totalAmount), 0)
        FROM AccountingTransaction t
        WHERE t.businessId = :businessId
          AND t.transactionType = :transactionType
          AND t.status = 'COMPLETED'
          AND t.createdAt >= :startDate
          AND t.createdAt <= :endDate
        """)
    BigDecimal sumTotalAmountByBusinessIdAndTypeAndPeriod(
            @Param("businessId") Long businessId,
            @Param("transactionType") AccountingTransactionType transactionType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Tong tien da thu (paidAmount) cua cac giao dich COMPLETED trong ky.
     */
    @Query("""
        SELECT COALESCE(SUM(t.paidAmount), 0)
        FROM AccountingTransaction t
        WHERE t.businessId = :businessId
          AND t.status = 'COMPLETED'
          AND t.createdAt >= :startDate
          AND t.createdAt <= :endDate
        """)
    BigDecimal sumPaidAmountByBusinessIdAndPeriod(
            @Param("businessId") Long businessId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Tong cong no phat sinh (debtAmount) cua cac giao dich COMPLETED trong ky.
     */
    @Query("""
        SELECT COALESCE(SUM(t.debtAmount), 0)
        FROM AccountingTransaction t
        WHERE t.businessId = :businessId
          AND t.status = 'COMPLETED'
          AND t.createdAt >= :startDate
          AND t.createdAt <= :endDate
        """)
    BigDecimal sumDebtAmountByBusinessIdAndPeriod(
            @Param("businessId") Long businessId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Tong hop 3 chi so doanh thu trong mot query duy nhat de giam round-trip DB.
     * Tra ve mang [totalAmount, paidAmount, debtAmount].
     */
    @Query("""
        SELECT
            COALESCE(SUM(t.totalAmount), 0),
            COALESCE(SUM(t.paidAmount), 0),
            COALESCE(SUM(t.debtAmount), 0)
        FROM AccountingTransaction t
        WHERE t.businessId = :businessId
          AND t.status = 'COMPLETED'
          AND t.createdAt >= :startDate
          AND t.createdAt <= :endDate
        """)
    Object[] sumRevenueByBusinessIdAndPeriod(
            @Param("businessId") Long businessId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
