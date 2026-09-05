package com.hbdt.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiParseOrderRequest(
        @NotBlank(message = "Vui lòng nhập câu đặt hàng")
        @Size(max = 4000, message = "Câu đặt hàng không được quá 4000 ký tự")
        String text
) {}
