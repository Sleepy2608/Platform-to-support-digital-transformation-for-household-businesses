package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_activity_groups", uniqueConstraints = @UniqueConstraint(
        name = "uk_tax_activity_groups_code_from",
        columnNames = {"activity_code", "effective_from"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxActivityGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "activity_code", nullable = false, length = 30)
    private String activityCode;

    @Column(name = "activity_name", nullable = false, length = 255)
    private String activityName;

    @Column(name = "vat_calculation_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal vatCalculationRate;

    @Column(name = "pit_calculation_rate", nullable = false, precision = 7, scale = 4)
    private BigDecimal pitCalculationRate;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
