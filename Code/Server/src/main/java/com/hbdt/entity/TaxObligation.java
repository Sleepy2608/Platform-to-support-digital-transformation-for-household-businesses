package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_obligations", uniqueConstraints = @UniqueConstraint(
        name = "uk_tax_obligations_business_code",
        columnNames = {"business_id", "obligation_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxObligation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "tax_type_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long taxTypeId;

    @Column(name = "obligation_code", nullable = false, length = 50)
    private String obligationCode;

    @Column(name = "period_from", nullable = false)
    private LocalDate periodFrom;

    @Column(name = "period_to", nullable = false)
    private LocalDate periodTo;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "taxable_revenue", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxableRevenue;

    @Column(name = "tax_rate", precision = 7, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
