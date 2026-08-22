package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "product_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productId;

    @Column(name = "unit_id", columnDefinition = "BIGINT UNSIGNED")
    private Long unitId;

    @Column(name = "entered_quantity", precision = 18, scale = 3)
    private BigDecimal enteredQuantity;

    @Column(name = "conversion_rate", precision = 18, scale = 6)
    private BigDecimal conversionRate;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "reference_id", columnDefinition = "BIGINT UNSIGNED")
    private Long referenceId;

    @Column(name = "quantity_change", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantityChange;

    @Column(name = "balance_after", nullable = false, precision = 18, scale = 3)
    private BigDecimal balanceAfter;

    @Column(name = "unit_cost", precision = 18, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "transaction_value", precision = 18, scale = 2)
    private BigDecimal transactionValue;

    @Column(name = "balance_value", precision = 18, scale = 2)
    private BigDecimal balanceValue;

    @Column(name = "cost_status", nullable = false, length = 20)
    private String costStatus;

    @Column(name = "costed_at")
    private LocalDateTime costedAt;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
