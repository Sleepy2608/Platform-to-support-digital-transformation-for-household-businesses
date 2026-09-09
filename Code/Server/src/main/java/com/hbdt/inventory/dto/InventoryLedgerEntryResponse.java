package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Từng dòng giao dịch trong Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu số S2-HKD).
 */
@Builder
public record InventoryLedgerEntryResponse(
        Long transactionId,
        String transactionType,
        String referenceType,
        Long referenceId,
        /** Mã chứng từ gốc: importCode, orderCode, hoặc ADJ-{id} */
        String referenceCode,
        String voucherNo,
        LocalDateTime voucherDate,
        String description,
        String unitName,
        BigDecimal unitCost,
        BigDecimal importQuantity,
        BigDecimal importAmount,
        BigDecimal exportQuantity,
        BigDecimal exportAmount,
        BigDecimal balanceAfterQuantity,
        BigDecimal balanceAfterValue,
        LocalDateTime createdAt
) {
}
