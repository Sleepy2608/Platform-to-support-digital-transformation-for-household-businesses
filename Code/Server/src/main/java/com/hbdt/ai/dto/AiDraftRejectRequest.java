package com.hbdt.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiDraftRejectRequest(
        @NotBlank(message = "Lý do từ chối không được để trống")
        @Size(max = 500, message = "Lý do từ chối không được vượt quá 500 ký tự")
        String reason
) {}
