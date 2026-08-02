package com.hbdt.entity;

import com.hbdt.entity.enums.BusinessProfileStatus;
import com.hbdt.entity.enums.BusinessType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Hồ sơ doanh nghiệp của chủ hộ kinh doanh.
 * Quan hệ 1-1 với User (owner). Thiết kế FK mở rộng sang 1-n ở tầng Store.
 */
@Entity
@Table(name = "business_profiles", uniqueConstraints = {
        @UniqueConstraint(name = "uq_business_profile_owner", columnNames = "owner_id"),
        @UniqueConstraint(name = "uq_business_profile_tax_code", columnNames = "tax_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Owner ────────────────────────────────────────────────
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // ── Business Info ─────────────────────────────────────────
    @Column(name = "business_name", nullable = false, length = 255)
    private String businessName;

    @Column(name = "tax_code", nullable = false, length = 20)
    private String taxCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false, length = 30)
    private BusinessType businessType;

    // ── Address ───────────────────────────────────────────────
    /** Mã tỉnh/thành theo ĐVHCVN (FK tham chiếu bảng provinces.code) */
    @Column(name = "province_code", nullable = false, length = 10)
    private String provinceCode;

    /** Mã quận/huyện */
    @Column(name = "district_code", nullable = false, length = 10)
    private String districtCode;

    /** Mã xã/phường/thị trấn */
    @Column(name = "ward_code", nullable = false, length = 10)
    private String wardCode;

    @Column(name = "detail_address", nullable = false, length = 500)
    private String detailAddress;

    // ── Status ────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BusinessProfileStatus status = BusinessProfileStatus.PENDING_REVIEW;

    // ── Audit ─────────────────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
