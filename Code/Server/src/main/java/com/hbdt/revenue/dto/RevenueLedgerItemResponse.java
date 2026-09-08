package com.hbdt.revenue.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RevenueLedgerItemResponse(
        Long id,
        Long salesOrderId,
        Long salesOrderItemId,
        String orderCode,
        LocalDateTime confirmedAt,
        Long customerId,
        String customerName,
        Long productId,
        String productName,
        Long unitId,
        String unitName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        BigDecimal orderTotalAmount,
        String status
) {
}
