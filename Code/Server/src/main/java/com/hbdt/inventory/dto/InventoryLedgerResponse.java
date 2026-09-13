package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Dữ liệu Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu số S2-HKD theo Thông tư 88/2021/TT-BTC).
 */
@Builder
public record InventoryLedgerResponse(
        // Thông tin hộ kinh doanh
        Long businessId,
        String businessName,
        String ownerName,
        String taxCode,
        String businessAddress,

        // Thông tin sản phẩm & đơn vị tính
        Long productId,
        String productCode,
        String productName,
        Long baseUnitId,
        String unitName,

        // Kỳ báo cáo
        LocalDateTime startDate,
        LocalDateTime endDate,
        Integer fiscalYear,

        // Số dư đầu kỳ
        BigDecimal openingQuantity,
        BigDecimal openingUnitCost,
        BigDecimal openingAmount,

        // Từng giao dịch phát sinh trong kỳ
        List<InventoryLedgerEntryResponse> entries,

        // Tổng phát sinh trong kỳ
        BigDecimal totalImportQuantity,
        BigDecimal totalImportAmount,
        BigDecimal totalExportQuantity,
        BigDecimal totalExportAmount,
        BigDecimal netQuantityChange,
        BigDecimal netAmountChange,

        // Số dư cuối kỳ
        BigDecimal closingQuantity,
        BigDecimal closingUnitCost,
        BigDecimal closingAmount
) {
}
