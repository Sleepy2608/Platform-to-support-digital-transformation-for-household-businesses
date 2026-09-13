package com.hbdt.revenue.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record RevenueLedgerPageResponse(
        List<RevenueLedgerItemResponse> items,
        List<StockImportLedgerItemResponse> stockImports,
        RevenueLedgerSummaryResponse summary,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static RevenueLedgerPageResponse of(
            Page<RevenueLedgerItemResponse> pageResult,
            List<StockImportLedgerItemResponse> stockImports,
            RevenueLedgerSummaryResponse summary
    ) {
        return new RevenueLedgerPageResponse(
                pageResult.getContent(),
                stockImports,
                summary,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isFirst(),
                pageResult.isLast()
        );
    }
}
