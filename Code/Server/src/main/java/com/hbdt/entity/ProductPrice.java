package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_prices", uniqueConstraints = @UniqueConstraint(
        name = "uk_product_prices_rule",
        columnNames = {"product_unit_id", "minimum_quantity", "effective_from"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "product_unit_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productUnitId;

    @Column(name = "minimum_quantity", nullable = false, precision = 18, scale = 3)
    private BigDecimal minimumQuantity;

    @Column(name = "sale_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "effective_from", nullable = false, insertable = false, updatable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
