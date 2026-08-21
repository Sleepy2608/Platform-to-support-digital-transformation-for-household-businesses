package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_order_items", uniqueConstraints = @UniqueConstraint(
        name = "uk_sales_order_items_line",
        columnNames = {"sales_order_id", "product_id", "unit_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "sales_order_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long salesOrderId;

    @Column(name = "product_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productId;

    @Column(name = "unit_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long unitId;

    @Column(name = "tax_activity_group_id", columnDefinition = "BIGINT UNSIGNED")
    private Long taxActivityGroupId;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "conversion_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal conversionRate;

    @Column(name = "base_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal baseQuantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "vat_calculation_rate", precision = 7, scale = 4)
    private BigDecimal vatCalculationRate;

    @Column(name = "pit_calculation_rate", precision = 7, scale = 4)
    private BigDecimal pitCalculationRate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
