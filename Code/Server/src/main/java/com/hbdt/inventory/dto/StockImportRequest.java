package com.hbdt.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request tạo phiếu nhập kho mới (Draft).
 */
public record StockImportRequest(
        @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
        String note,
        @NotEmpty(message = "Phiếu nhập phải có ít nhất một sản phẩm")
        List<@Valid StockImportItemRequest> items
) {}
