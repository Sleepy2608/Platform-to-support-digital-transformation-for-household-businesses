package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_invoices", indexes = {
        @Index(name = "idx_service_invoices_user", columnList = "user_id"),
        @Index(name = "idx_service_invoices_subscription", columnList = "subscription_id"),
        @Index(name = "idx_service_invoices_plan", columnList = "plan_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceInvoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "invoice_code", nullable = false, unique = true, length = 50)
    private String invoiceCode;

    /**
     * Số hóa đơn — tương thích với schema cũ có cột {@code invoice_no} (NOT NULL).
     * Định dạng: INV-YYYYMMDD-XXXX
     */
    @Column(name = "invoice_no", length = 50)
    private String invoiceNo;

    /**
     * ID doanh nghiệp — cột BIGINT UNSIGNED NOT NULL trong schema cũ.
     * Giá trị được lấy từ subscription.getBusinessId().
     */
    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, columnDefinition = "BIGINT UNSIGNED", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_id", nullable = false, columnDefinition = "BIGINT UNSIGNED", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false, columnDefinition = "BIGINT UNSIGNED", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private SubscriptionPlan plan;

    @Column(name = "duration", nullable = false)
    private Integer duration;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    /**
     * Cột {@code amount} được giữ trong schema cũ (NOT NULL, không default)
     * cho mục đích tương thích ngược. Giá trị mặc định bằng {@link #totalAmount}.
     */
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
