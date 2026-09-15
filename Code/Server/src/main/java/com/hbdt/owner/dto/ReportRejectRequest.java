package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request DTO for rejecting a report.
 * The rejection reason is mandatory so the Owner must explain why.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportRejectRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 1000, message = "Lý do từ chối không được vượt quá 1000 ký tự")
    private String rejectionReason;
}
