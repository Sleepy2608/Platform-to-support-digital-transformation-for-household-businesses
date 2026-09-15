package com.hbdt.revenue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AccountingReportReviewRequest(
        LocalDate fromDate,
        LocalDate toDate,
        @NotBlank String status,
        @Size(max = 500) String note
) {
}
