package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_balances", uniqueConstraints = @UniqueConstraint(
        name = "uk_inventory_balances_business_product",
        columnNames = {"business_id", "product_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "product_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long productId;

    @Column(name = "quantity_on_hand", nullable = false, precision = 18, scale = 3)
    private BigDecimal quantityOnHand;

    @Column(name = "average_unit_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal averageUnitCost;

    @Column(name = "inventory_value", nullable = false, precision = 18, scale = 2)
    private BigDecimal inventoryValue;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
