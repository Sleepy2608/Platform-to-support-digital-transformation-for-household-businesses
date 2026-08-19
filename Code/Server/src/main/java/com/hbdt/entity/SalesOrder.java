package com.hbdt.entity;

import com.hbdt.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_orders", uniqueConstraints = @UniqueConstraint(
        name = "uk_sales_orders_business_code", columnNames = {"business_id", "order_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "customer_id", columnDefinition = "BIGINT UNSIGNED")
    private Long customerId;

    @Column(name = "created_by", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "confirmed_by", columnDefinition = "BIGINT UNSIGNED")
    private Long confirmedBy;

    @Column(name = "order_code", nullable = false, length = 50)
    private String orderCode;

    @Column(name = "source", nullable = false, length = 20)
    private String source;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "debt_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal debtAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "last_payment_at")
    private LocalDateTime lastPaymentAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}

