package com.hbdt.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerPurchaseHistoryResponse(
        Long orderId,
        String orderCode,
        LocalDateTime createdAt,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal debtAmount,
        String paymentStatus
) {}
