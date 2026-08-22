package com.hbdt.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SalesOrderResponse(
        Long id,
        String orderCode,
        Long customerId,
        String source,
        String status,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal debtAmount,
        String note,
        LocalDateTime createdAt,
        List<SalesOrderItemResponse> items
) {
}
