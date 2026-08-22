package com.hbdt.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SalesOrderSummaryResponse(
        Long id,
        String orderCode,
        String source,
        String status,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal debtAmount,
        LocalDateTime createdAt
) {
}
