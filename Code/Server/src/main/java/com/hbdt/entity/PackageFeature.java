package com.hbdt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Bảng trung gian thể hiện mối quan hệ nhiều-nhiều giữa SubscriptionPlan và Feature.
 * Lưu trữ cấu hình giới hạn (quota/limit) và trạng thái bật/tắt
 * của từng feature tương ứng với mỗi gói dịch vụ.
 */
@Entity
@Table(name = "package_features", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"plan_id", "feature_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "plan_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private SubscriptionPlan plan;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "feature_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Feature feature;

    /**
     * Bật/tắt feature cho package cụ thể.
     * Admin có thể toggle mà không cần deploy lại.
     */
    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /**
     * Giới hạn quota cho feature trong package (nullable = không giới hạn).
     * Ví dụ: gói BASIC chỉ cho tạo tối đa 50 sản phẩm.
     */
    @Column(name = "quota_limit")
    private Integer quotaLimit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (enabled == null) {
            enabled = true;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
