package com.hbdt.payment.dto;

import java.math.BigDecimal;

public record OrderPaymentSummaryResponse(
        Long salesOrderId,
        String orderCode,
        Long customerId,
        String customerName,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        String paymentStatus,
        int transactionCount
) {
}
