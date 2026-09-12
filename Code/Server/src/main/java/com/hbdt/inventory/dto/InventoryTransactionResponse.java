package com.hbdt.inventory.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record InventoryTransactionResponse(
        Long transactionId,
        Long productId,
        String productName,
        String productCode,
        String transactionType,
        String referenceType,
        Long referenceId,
        /** Mã chứng từ gốc: importCode (STOCK_IN), orderCode (STOCK_OUT/CANCEL_SALE), ADJ-{id} (ADJUSTMENT) */
        String referenceCode,
        BigDecimal enteredQuantity,
        BigDecimal baseQuantity,
        BigDecimal quantityBefore,
        BigDecimal quantityChange,
        BigDecimal quantityAfter,
        String unitName,
        BigDecimal unitCost,
        BigDecimal transactionValue,
        String note,
        String createdByName,
        LocalDateTime createdAt
) {
}
