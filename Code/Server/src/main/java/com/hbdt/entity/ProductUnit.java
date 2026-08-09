package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_units", uniqueConstraints = @UniqueConstraint(
        name = "uk_product_units_product_unit", columnNames = {"product_id", "unit_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "product_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productId;

    @Column(name = "unit_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long unitId;

    @Column(name = "conversion_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal conversionRate;

    @Column(name = "is_base_unit", nullable = false)
    private Boolean baseUnit;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
