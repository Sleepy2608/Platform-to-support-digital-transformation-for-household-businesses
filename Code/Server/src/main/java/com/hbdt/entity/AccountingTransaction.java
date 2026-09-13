package com.hbdt.entity;

import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.AccountingTransactionType;
import com.hbdt.entity.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * But toan ke toan tu dong -- HBDT-59 Automatic Sales Bookkeeping.
 *
 * <p>Moi don hang duoc xac nhan se sinh ra dung mot ban ghi trong bang nay.
 * Cot order_id co UNIQUE index dam bao tinh idempotency:
 * du service ghi so bi goi lai nhieu lan, DB chi chap nhan lan dau tien.</p>
 *
 * <p>Entity nay la immutable record -- khong co @PreUpdate vi but toan
 * ke toan khong duoc sua sau khi da ghi. Neu can dao but toan, tao ban ghi
 * moi voi transactionType = RETURN.</p>
 */
@Entity
@Table(
    name = "accounting_transactions",
    indexes = {
        @Index(
            name = "uk_accounting_transactions_order_id",
            columnList = "order_id",
            unique = true
        ),
        @Index(
            name = "idx_accounting_transactions_business_created",
            columnList = "business_id, created_at"
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    /**
     * ID cua ho kinh doanh -- bat buoc de phan vung du lieu da-tenant.
     */
    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    /**
     * ID don hang nguon -- co UNIQUE index de chong ghi nhan trung (idempotency).
     * Khong dung FK cung de tranh coupling giua bang ke toan va bang don hang.
     */
    @Column(name = "order_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long orderId;

    /**
     * ID khach hang -- nullable vi co the la khach vang lai.
     */
    @Column(name = "customer_id", columnDefinition = "BIGINT UNSIGNED")
    private Long customerId;

    /**
     * Loai giao dich ke toan: SALE, PAYMENT, RETURN.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private AccountingTransactionType transactionType;

    /**
     * Tong gia tri don hang.
     */
    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    /**
     * So tien khach da thanh toan tai thoi diem ghi so.
     */
    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;

    /**
     * So tien con no = totalAmount - paidAmount.
     */
    @Column(name = "debt_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal debtAmount;

    /**
     * Phuong thuc thanh toan: CASH, BANK_TRANSFER, DEBT.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    /**
     * Trang thai but toan: COMPLETED hoac CANCELLED.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AccountingTransactionStatus status = AccountingTransactionStatus.COMPLETED;

    /**
     * User ID thuc hien giao dich (nhan vien / chu ho).
     */
    @Column(name = "created_by", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    /**
     * Thoi diem ghi so -- immutable, khong co @PreUpdate.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}