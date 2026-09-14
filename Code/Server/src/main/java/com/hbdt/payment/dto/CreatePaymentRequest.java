package com.hbdt.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreatePaymentRequest(

        @NotNull(message = "Mã đơn hàng không được để trống")
        Long salesOrderId,

        Long customerId,

        Long invoiceId,

        @NotNull(message = "Số tiền thanh toán không được để trống")
        @DecimalMin(value = "0.01", message = "Số tiền thanh toán phải lớn hơn 0")
        BigDecimal amount,

        @NotBlank(message = "Phương thức thanh toán không được để trống")
        @Pattern(regexp = "^(?i)(CASH|BANK_TRANSFER)$", message = "Phương thức thanh toán chỉ hỗ trợ: CASH, BANK_TRANSFER")
        @Size(max = 30, message = "Phương thức thanh toán không được vượt quá 30 ký tự")
        String paymentMethod,

        @Size(max = 100, message = "Mã tham chiếu không được vượt quá 100 ký tự")
        String referenceNumber,

        LocalDateTime paymentDate,

        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String note
) {
}

