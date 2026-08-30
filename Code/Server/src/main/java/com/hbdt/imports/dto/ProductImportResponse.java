package com.hbdt.imports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for import API response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImportResponse {
    private boolean success;
    private String message;
    private int totalRows;
    private int successCount;
    private int failedCount;
    private int errorCount;
    private int skipCount;
    private List<ProductImportRowError> errors;

    public static ProductImportResponse success(int total, int success, int skip) {
        return ProductImportResponse.builder()
                .success(true)
                .message("Nhập thành công " + success + " sản phẩm")
                .totalRows(total).successCount(success).failedCount(0).errorCount(0).skipCount(skip)
                .build();
    }

    public static ProductImportResponse partial(int total, int success, int skip, List<ProductImportRowError> errors) {
        int failed = (int) errors.stream()
                .map(ProductImportRowError::getRowNumber)
                .distinct()
                .count();
        return ProductImportResponse.builder()
                .success(true)
                .message(String.format(
                        "Nhập hoàn tất: %d thành công, %d thất bại (%d lỗi)",
                        success, failed, errors.size()))
                .totalRows(total).successCount(success).failedCount(failed)
                .errorCount(errors.size()).skipCount(skip)
                .errors(errors)
                .build();
    }

    public static ProductImportResponse failed(String message) {
        return ProductImportResponse.builder()
                .success(false).message(message).totalRows(0).successCount(0)
                .failedCount(0).errorCount(0).skipCount(0)
                .build();
    }
}
