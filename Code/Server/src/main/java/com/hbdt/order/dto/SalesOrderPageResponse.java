package com.hbdt.order.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record SalesOrderPageResponse(
        List<SalesOrderSummaryResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static SalesOrderPageResponse from(Page<SalesOrderSummaryResponse> source) {
        return new SalesOrderPageResponse(
                source.getContent(), source.getNumber(), source.getSize(), source.getTotalElements(),
                source.getTotalPages(), source.isFirst(), source.isLast()
        );
    }
}
