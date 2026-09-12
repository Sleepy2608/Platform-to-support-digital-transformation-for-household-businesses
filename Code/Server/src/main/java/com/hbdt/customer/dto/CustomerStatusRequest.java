package com.hbdt.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO cho API thay đổi trạng thái khách hàng (HBDT-47).
 */
public record CustomerStatusRequest(

        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
        String status
) {
}
