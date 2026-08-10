package com.hbdt.consent.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Xác nhận của người dùng trước khi đăng ký tài khoản.
 * Tất cả các cờ bắt buộc phải là {@code true} thì mới được tiếp tục.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConsentRequest {

    @NotBlank(message = "Phiên bản Điều khoản sử dụng là bắt buộc")
    private String termsVersion;

    @NotBlank(message = "Phiên bản Chính sách bảo mật là bắt buộc")
    private String privacyVersion;

    @AssertTrue(message = "Bạn phải đồng ý với Điều khoản sử dụng")
    private boolean termsAccepted;

    @AssertTrue(message = "Bạn phải đồng ý với Chính sách bảo mật")
    private boolean privacyAccepted;

    @AssertTrue(message = "Bạn phải đồng ý cho phép xử lý dữ liệu kinh doanh")
    private boolean dataProcessingAccepted;

    @AssertTrue(message = "Bạn phải xác nhận hiểu rõ Thông báo về Thông tư 88/2021/TT-BTC")
    private boolean circular88Accepted;

    @AssertTrue(message = "Bạn phải xác nhận thông tin cung cấp là chính xác và đầy đủ")
    private boolean infoAccurateConfirmed;

    @AssertTrue(message = "Bạn phải hiểu rằng thông tin không chính xác có thể dẫn đến báo cáo/sổ kế toán sai")
    private boolean inaccuracyUnderstood;
}
