package com.hbdt.entity;

import com.hbdt.entity.enums.DebtTransactionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "debt_transactions", uniqueConstraints = @UniqueConstraint(
        name = "uk_debt_transactions_business_code",
        columnNames = {"business_id", "transaction_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebtTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "customer_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long customerId;

    @Column(name = "sales_order_id", columnDefinition = "BIGINT UNSIGNED")
    private Long salesOrderId;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "transaction_code", length = 50)
    private String transactionCode;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "transaction_date", nullable = false, insertable = false, updatable = false)
    private LocalDateTime transactionDate;

    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DebtTransactionStatus status = DebtTransactionStatus.ACTIVE;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}

