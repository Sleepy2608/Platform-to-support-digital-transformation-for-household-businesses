package com.hbdt.imports.service;

import com.hbdt.imports.dto.ProductImportRowError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generator for product import error reports
 */
@Component
@Slf4j
public class ProductImportErrorReportGenerator {

    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * Generate error report as byte array
     */
    public byte[] generateErrorReportBytes(List<ProductImportRowError> errors) {
        StringBuilder sb = new StringBuilder();

        sb.append("BÁO CÁO LỖI NHẬP SẢN PHẨM\n");
        sb.append("Thời gian: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))).append("\n");
        sb.append("Tổng số lỗi: ").append(errors.size()).append("\n");
        sb.append("\n");
        sb.append("Dòng,Trường,Giá trị,Lỗi\n");

        for (ProductImportRowError error : errors) {
            sb.append(error.getRowNumber()).append(",");
            sb.append(escapeCsv(error.getField())).append(",");
            sb.append(escapeCsv(error.getValue())).append(",");
            sb.append(escapeCsv(error.getErrorMessage())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generate filename for error report
     */
    public String generateErrorReportFilename() {
        String timestamp = LocalDateTime.now().format(FILE_DATE_FORMAT);
        return "bao_cao_loi_nhap_san_pham_" + timestamp + ".csv";
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
