package com.hbdt.inventory.dto;

import java.util.List;

/**
 * Phân trang danh sách phiếu nhập kho.
 */
public record StockImportPageResponse(
        List<StockImportResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {}
