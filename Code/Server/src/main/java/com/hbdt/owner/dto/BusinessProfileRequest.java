package com.hbdt.owner.dto;

import com.hbdt.entity.enums.BusinessType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body cho POST/PUT /api/owner/business-profile.
 * Bao gồm 3 section: Business Info, Representative Info, Store Info.
 */
@Getter
@Setter
public class BusinessProfileRequest {

    @Valid
    @NotNull(message = "Thông tin doanh nghiệp không được để trống")
    private BusinessInfoDto businessInfo;

    @Valid
    @NotNull(message = "Thông tin người đại diện không được để trống")
    private RepresentativeDto representative;

    @Valid
    @NotNull(message = "Thông tin cửa hàng không được để trống")
    private StoreDto store;

    // ── Section 1: Business Info ──────────────────────────────────────────────

    @Getter
    @Setter
    public static class BusinessInfoDto {

        @NotBlank(message = "Tên doanh nghiệp không được để trống")
        @Size(max = 255, message = "Tên doanh nghiệp tối đa 255 ký tự")
        private String businessName;

        /**
         * Mã số thuế: 10 hoặc 13 chữ số.
         */
        @NotBlank(message = "Mã số thuế không được để trống")
        @Pattern(
                regexp = "^\\d{10}(\\d{3})?$",
                message = "Mã số thuế phải có 10 hoặc 13 chữ số"
        )
        private String taxCode;

        @NotNull(message = "Loại hình kinh doanh không được để trống")
        private BusinessType businessType;

        @NotBlank(message = "Mã tỉnh/thành không được để trống")
        private String provinceCode;

        @NotBlank(message = "Mã quận/huyện không được để trống")
        private String districtCode;

        @NotBlank(message = "Mã xã/phường không được để trống")
        private String wardCode;

        @NotBlank(message = "Địa chỉ chi tiết không được để trống")
        @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
        private String detailAddress;
    }

    // ── Section 2: Representative Info ───────────────────────────────────────

    @Getter
    @Setter
    public static class RepresentativeDto {

        @NotBlank(message = "Họ và tên người đại diện không được để trống")
        @Size(max = 255, message = "Họ và tên tối đa 255 ký tự")
        private String fullName;

        /**
         * Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0.
         */
        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(
                regexp = "^0\\d{9}$",
                message = "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0"
        )
        private String phoneNumber;

        @NotBlank(message = "Email người đại diện không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        private String email;
    }

    // ── Section 3: Store Info ─────────────────────────────────────────────────

    @Getter
    @Setter
    public static class StoreDto {

        @NotBlank(message = "Tên cửa hàng không được để trống")
        @Size(max = 255, message = "Tên cửa hàng tối đa 255 ký tự")
        private String storeName;

        /** URL logo — được set sau khi upload, không bắt buộc tại thời điểm submit */
        private String logoUrl;

        /** URL ảnh bìa — được set sau khi upload, không bắt buộc */
        private String coverImageUrl;
    }
}
