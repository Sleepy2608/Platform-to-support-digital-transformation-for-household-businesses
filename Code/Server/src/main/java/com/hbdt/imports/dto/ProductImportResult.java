package com.hbdt.imports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO for import result summary
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImportResult {

    private int totalRows;
    private int successCount;
    private int errorCount;
    private int skipCount;

    @Builder.Default
    private List<ProductImportRowError> errors = new ArrayList<>();

    @Builder.Default
    private List<ProductImportRequest> successfulRows = new ArrayList<>();

    public static ProductImportResult empty() {
        return ProductImportResult.builder()
                .totalRows(0).successCount(0).errorCount(0).skipCount(0)
                .errors(new ArrayList<>()).successfulRows(new ArrayList<>())
                .build();
    }

    public void addError(int rowNumber, String field, String value, String message) {
        this.errors.add(ProductImportRowError.builder()
                .rowNumber(rowNumber).field(field).value(value).errorMessage(message).build());
        this.errorCount++;
    }

    public void addSuccess(ProductImportRequest row) {
        this.successfulRows.add(row);
        this.successCount++;
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
