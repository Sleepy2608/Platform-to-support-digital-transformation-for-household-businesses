package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "tax_obligation_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long taxObligationId;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "payment_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
