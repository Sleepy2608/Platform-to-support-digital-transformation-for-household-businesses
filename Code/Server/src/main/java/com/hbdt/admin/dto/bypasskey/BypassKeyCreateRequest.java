package com.hbdt.admin.dto.bypasskey;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BypassKeyCreateRequest {

    /**
     * Mã Bypass Key gồm 20 chữ số.
     * Nếu để trống, hệ thống sẽ tự động sinh 20 chữ số ngẫu nhiên an toàn.
     */
    @Pattern(regexp = "^$|^[0-9]{20}$", message = "Mã Bypass Key nếu tự đặt phải gồm đúng 20 chữ số")
    private String keyCode;

    @NotNull(message = "Số lần sử dụng tối đa không được để trống")
    @Min(value = 1, message = "Số lần sử dụng tối đa phải từ 1 trở lên")
    private Integer maxUses;

    @Size(max = 255, message = "Ghi chú không được quá 255 ký tự")
    private String note;

    private LocalDateTime expiresAt;
}

