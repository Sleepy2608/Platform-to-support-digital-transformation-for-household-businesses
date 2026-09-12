package com.hbdt.revenue.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockImportLedgerItemResponse(
        Long id,
        String importCode,
        LocalDateTime importDate,
        BigDecimal totalAmount,
        String createdByName,
        String status,
        String note
) {
}
