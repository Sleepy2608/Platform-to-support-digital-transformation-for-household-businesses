package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bản ghi xác nhận Điều khoản sử dụng &amp; Chính sách bảo mật của người dùng.
 * Được lưu giữ để đối chiếu và kiểm tra khi cần thiết (audit — Chính sách bảo mật mục 7).
 */
@Entity
@Table(name = "terms_consents", indexes = {
        @Index(name = "idx_terms_consent_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TermsConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ── Phiên bản văn bản ─────────────────────────────────────
    @Column(name = "terms_version", length = 20)
    private String termsVersion;

    @Column(name = "privacy_version", length = 20)
    private String privacyVersion;

    // ── Các mục xác nhận (6 mục) ──────────────────────────────
    /** Đã đọc và đồng ý với Điều khoản sử dụng */
    @Column(name = "terms_accepted", nullable = false)
    @Builder.Default
    private boolean termsAccepted = false;

    /** Đã đọc và đồng ý với Chính sách bảo mật */
    @Column(name = "privacy_accepted", nullable = false)
    @Builder.Default
    private boolean privacyAccepted = false;

    /** Đồng ý cho phép Nền tảng xử lý dữ liệu kinh doanh */
    @Column(name = "data_processing_accepted", nullable = false)
    @Builder.Default
    private boolean dataProcessingAccepted = false;

    /** Hiểu dữ liệu có thể được dùng để lập sổ kế toán theo Thông tư 88/2021/TT-BTC (S1-HKD, S2-HKD, S4-HKD) */
    @Column(name = "circular88_accepted", nullable = false)
    @Builder.Default
    private boolean circular88Accepted = false;

    /** Xác nhận thông tin đã cung cấp là chính xác và đầy đủ */
    @Column(name = "info_accurate_confirmed", nullable = false)
    @Builder.Default
    private boolean infoAccurateConfirmed = false;

    /** Hiểu rằng thông tin không chính xác có thể dẫn đến báo cáo/sổ kế toán không đúng */
    @Column(name = "inaccuracy_understood", nullable = false)
    @Builder.Default
    private boolean inaccuracyUnderstood = false;

    // ── Audit ─────────────────────────────────────────────────
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "accepted_at", nullable = false, updatable = false)
    private LocalDateTime acceptedAt;

    @PrePersist
    protected void onCreate() {
        acceptedAt = LocalDateTime.now();
    }
}
