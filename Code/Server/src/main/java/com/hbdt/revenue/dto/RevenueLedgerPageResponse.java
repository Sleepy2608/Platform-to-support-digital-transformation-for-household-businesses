package com.hbdt.revenue.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record RevenueLedgerPageResponse(
        List<RevenueLedgerItemResponse> items,
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
            RevenueLedgerSummaryResponse summary
    ) {
        return new RevenueLedgerPageResponse(
                pageResult.getContent(),
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
