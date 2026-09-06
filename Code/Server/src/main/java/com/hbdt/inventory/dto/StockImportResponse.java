package com.hbdt.inventory.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response trả về chi tiết phiếu nhập kho.
 */
public record StockImportResponse(
        Long id,
        String importCode,
        LocalDateTime importDate,
        String status,
        BigDecimal totalAmount,
        String note,
        Long createdBy,
        String createdByName,
        LocalDateTime createdAt,
        List<StockImportItemResponse> items
) {}
