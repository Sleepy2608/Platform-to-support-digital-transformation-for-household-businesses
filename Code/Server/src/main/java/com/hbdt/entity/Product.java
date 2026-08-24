package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "products",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_products_business_code", columnNames = {"business_id", "product_code"}
        ),
        indexes = {
                @Index(name = "idx_products_business_status", columnList = "business_id, status"),
                @Index(name = "idx_products_business_category", columnList = "business_id, category_id"),
                @Index(name = "idx_products_business_code", columnList = "business_id, product_code"),
                @Index(name = "idx_products_business_name", columnList = "business_id, product_name")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "category_id", columnDefinition = "BIGINT UNSIGNED")
    private Long categoryId;

    @Column(name = "base_unit_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long baseUnitId;

    @Column(name = "default_tax_activity_group_id", columnDefinition = "BIGINT UNSIGNED")
    private Long defaultTaxActivityGroupId;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "sale_price", precision = 18, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
