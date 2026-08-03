package com.hbdt.entity;

import com.hbdt.entity.enums.BusinessProfileStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * JPA mapping for the canonical businesses table.
 * The class name is retained to preserve the existing owner API surface.
 */
@Entity
@Table(name = "businesses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_code", nullable = false, unique = true, length = 30)
    private String businessCode;

    @Column(name = "business_name", nullable = false, length = 255)
    private String businessName;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * Compact JSON payload used to preserve onboarding address fields without
     * introducing tables that are outside the approved 33-table schema.
     */
    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "tax_code", length = 20)
    private String taxCode;

    @Column(name = "inventory_valuation_method", nullable = false, length = 30)
    @Builder.Default
    private String inventoryValuationMethod = "PERIODIC_WEIGHTED_AVERAGE";

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BusinessProfileStatus status = BusinessProfileStatus.PENDING_REVIEW;

    @Column(name = "logo_object_key", length = 500)
    private String logoObjectKey;

    @Column(name = "cover_image_object_key", length = 500)
    private String coverImageObjectKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (inventoryValuationMethod == null) {
            inventoryValuationMethod = "PERIODIC_WEIGHTED_AVERAGE";
        }
        if (status == null) {
            status = BusinessProfileStatus.PENDING_REVIEW;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
