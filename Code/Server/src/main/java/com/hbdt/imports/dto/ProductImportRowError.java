package com.hbdt.imports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for tracking import row errors
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImportRowError {
    private int rowNumber;
    private String field;
    private String value;
    private String errorMessage;
}
