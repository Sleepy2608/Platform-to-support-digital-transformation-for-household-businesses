package com.hbdt.customer.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record CustomerPurchaseHistoryPageResponse(
        List<CustomerPurchaseHistoryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static CustomerPurchaseHistoryPageResponse from(Page<CustomerPurchaseHistoryResponse> source) {
        return new CustomerPurchaseHistoryPageResponse(
                source.getContent(), source.getNumber(), source.getSize(), source.getTotalElements(),
                source.getTotalPages(), source.isFirst(), source.isLast()
        );
    }
}
