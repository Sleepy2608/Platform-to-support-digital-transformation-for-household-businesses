package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Báo cáo tổng hợp sổ kho theo kỳ (Mẫu S2-HKD).
 */
@Builder
public record InventoryBookkeepingSummaryResponse(
        Long businessId,
        String businessName,
        String taxCode,
        String businessAddress,
        LocalDateTime startDate,
        LocalDateTime endDate,
        BigDecimal totalImportQuantity,
        BigDecimal totalImportAmount,
        BigDecimal totalExportQuantity,
        BigDecimal totalExportAmount,
        long totalTransactions,
        List<InventoryProductSummaryResponse> productSummaries
) {
}
