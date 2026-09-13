package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "revenue_ledger_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_revenue_ledger_order_item",
                columnNames = {"sales_order_id", "sales_order_item_id"}
        ),
        indexes = {
                @Index(name = "idx_rev_ledger_biz_date", columnList = "business_id, confirmed_at"),
                @Index(name = "idx_rev_ledger_order_code", columnList = "business_id, order_code"),
                @Index(name = "idx_rev_ledger_customer", columnList = "business_id, customer_id"),
                @Index(name = "idx_rev_ledger_product", columnList = "business_id, product_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "sales_order_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long salesOrderId;

    @Column(name = "sales_order_item_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long salesOrderItemId;

    @Column(name = "order_code", nullable = false, length = 50)
    private String orderCode;

    @Column(name = "confirmed_at", nullable = false)
    private LocalDateTime confirmedAt;

    @Column(name = "customer_id", columnDefinition = "BIGINT UNSIGNED")
    private Long customerId;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "product_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productId;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "unit_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long unitId;

    @Column(name = "unit_name", nullable = false, length = 50)
    private String unitName;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "order_total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal orderTotalAmount;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
