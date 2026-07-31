package com.hbdt.owner.dto;

import com.hbdt.entity.enums.BusinessProfileStatus;
import com.hbdt.entity.enums.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response trả về sau khi tạo/cập nhật hồ sơ doanh nghiệp.
 * BẮT BUỘC có field nextStep theo yêu cầu SCRUM-19.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessProfileResponse {

    // ── Business Profile ──────────────────────────────────────
    private Long id;
    private Long ownerId;

    // Business Info
    private String businessName;
    private String taxCode;
    private BusinessType businessType;

    // Address
    private String provinceCode;
    private String provinceName;
    private String districtCode;
    private String districtName;
    private String wardCode;
    private String wardName;
    private String detailAddress;

    private BusinessProfileStatus status;

    // ── Representative ────────────────────────────────────────
    private RepresentativeInfo representative;

    // ── Store ─────────────────────────────────────────────────
    private StoreInfo store;

    // ── Audit ─────────────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Step tiếp theo trong Onboarding Wizard.
     * Luôn trả về "PACKAGE_SELECTION" sau khi lưu hồ sơ thành công.
     */
    @Builder.Default
    private String nextStep = "PACKAGE_SELECTION";

    // ── Nested DTOs ───────────────────────────────────────────

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepresentativeInfo {
        private Long id;
        private String fullName;
        private String phoneNumber;
        private String email;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StoreInfo {
        private Long id;
        private String storeName;
        private String logoUrl;
        private String coverImageUrl;
    }
}
