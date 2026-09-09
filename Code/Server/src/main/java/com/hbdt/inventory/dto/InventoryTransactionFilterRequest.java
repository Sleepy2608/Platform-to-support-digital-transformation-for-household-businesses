package com.hbdt.inventory.dto;

import lombok.Builder;

@Builder
public record InventoryTransactionFilterRequest(
        Long productId,
        String transactionType,
        String from,
        String to,
        String referenceType,
        Long referenceId,
        Integer page,
        Integer size
) {
    public int getResolvedPage() {
        return page == null || page < 0 ? 0 : page;
    }

    public int getResolvedSize() {
        if (size == null || size <= 0) {
            return 20;
        }
        return Math.min(size, 100);
    }
}
