package com.hbdt.order.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderCode,
        String source,
        String status,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal debtAmount,
        String customerName,
        String note,
        List<OrderItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
