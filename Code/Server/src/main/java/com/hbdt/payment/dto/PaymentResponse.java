package com.hbdt.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        String transactionCode,
        Long salesOrderId,
        String orderCode,
        Long customerId,
        String customerName,
        BigDecimal amount,
        String paymentMethod,
        String referenceNumber,
        String note,
        String transactionType,
        String status,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        String paymentStatus,
        BigDecimal balanceAfter,
        LocalDateTime paymentDate,
        String createdByUsername,
        LocalDateTime createdAt
) {
}
