package com.hbdt.imports.service;

import com.hbdt.imports.dto.ProductImportRowError;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductImportErrorReportGeneratorTest {

    @Test
    void reportUsesVietnameseHeadersAndPreventsSpreadsheetFormulas() {
        ProductImportErrorReportGenerator generator = new ProductImportErrorReportGenerator();
        byte[] report = generator.generateErrorReportBytes(List.of(
                ProductImportRowError.builder()
                        .rowNumber(10)
                        .field("productCode")
                        .value("=1+1")
                        .errorMessage("Mã sản phẩm không hợp lệ")
                        .build()));

        String content = new String(report, StandardCharsets.UTF_8);
        assertTrue(content.startsWith("\uFEFFBÁO CÁO LỖI NHẬP SẢN PHẨM"));
        assertTrue(content.contains("Mã sản phẩm"));
        assertTrue(content.contains("'=1+1"));
    }
}
