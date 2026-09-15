package com.hbdt.accounting.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTaxPaymentRequest(LocalDate fromDate, LocalDate toDate,
        @NotBlank String taxCode, @NotNull LocalDate paymentDate,
        @NotNull @DecimalMin(value = "0.01") BigDecimal paymentAmount,
        @Size(max = 100) String documentNumber, @Size(max = 30) String paymentMethod,
        @Size(max = 100) String referenceNumber, @Size(max = 500) String note) {
}
