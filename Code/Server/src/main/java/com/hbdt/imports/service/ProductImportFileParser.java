package com.hbdt.imports.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.imports.dto.ProductImportRequest;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Parser and template generator for product import files
 */
@Component
@Slf4j
public class ProductImportFileParser {

    private static final String CSV_HEADER = "productCode,productName,categoryCode,baseUnitCode,salePrice,quantityOnHand,status,description";
    private static final String VIETNAMESE_CSV_HEADER =
            "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả";

    /**
     * Parse file content into list of ProductImportRequest
     */
    public List<ProductImportRequest> parseFile(byte[] fileBytes, String fileName) {
        String lowerFileName = fileName.toLowerCase();

        if (lowerFileName.endsWith(".xlsx")) {
            return parseXlsx(fileBytes);
        }
        if (lowerFileName.endsWith(".csv")) {
            return parseCsv(new String(fileBytes, StandardCharsets.UTF_8));
        }

        throw new BadRequestException(
                "Định dạng tệp không được hỗ trợ. Vui lòng sử dụng tệp .xlsx hoặc .csv");
    }

    /**
     * Parse CSV content
     */
    private List<ProductImportRequest> parseCsv(String content) {
        List<ProductImportRequest> rows = new ArrayList<>();
        String[] lines = content.split("\\r?\\n");

        if (lines.length < 1) {
            throw new BadRequestException("Tệp .csv không chứa dữ liệu");
        }

        int headerRowIndex = findCsvHeaderRow(lines);
        if (headerRowIndex < 0) {
            throw new BadRequestException("Không tìm thấy dòng tiêu đề hợp lệ trong tệp .csv");
        }

        for (int i = headerRowIndex + 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty() || line.startsWith("#")) continue;

            try {
                ProductImportRequest row = parseCsvLine(line);
                rows.add(row);
            } catch (Exception e) {
                log.warn("Failed to parse CSV line {}: {}", i + 1, e.getMessage());
            }
        }

        return rows;
    }

    private int findCsvHeaderRow(String[] lines) {
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].replace("\uFEFF", "").trim();
            if (CSV_HEADER.equalsIgnoreCase(line) || VIETNAMESE_CSV_HEADER.equalsIgnoreCase(line)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Parse an Excel workbook using the first worksheet.
     */
    private List<ProductImportRequest> parseXlsx(byte[] fileBytes) {
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(fileBytes))) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new BadRequestException("Tệp .xlsx không có trang tính");
            }

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            int headerRowIndex = findExcelHeaderRow(sheet, formatter);
            if (headerRowIndex < 0) {
                throw new BadRequestException("Không tìm thấy dòng tiêu đề hợp lệ trong tệp .xlsx");
            }

            List<ProductImportRequest> rows = new ArrayList<>();
            for (int rowIndex = headerRowIndex + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;

                List<String> values = new ArrayList<>();
                for (int columnIndex = 0; columnIndex < 8; columnIndex++) {
                    values.add(formatter.formatCellValue(
                            row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL)).trim());
                }

                String firstValue = values.get(0);
                if (firstValue.isEmpty() || firstValue.startsWith("#")) continue;
                rows.add(toImportRequest(values));
            }
            return rows;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to parse Excel workbook: {}", e.getMessage());
            throw new BadRequestException("Tệp .xlsx không hợp lệ hoặc đã bị hỏng");
        }
    }

    private int findExcelHeaderRow(Sheet sheet, DataFormatter formatter) {
        for (int rowIndex = sheet.getFirstRowNum(); rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) continue;

            String firstCell = formatter.formatCellValue(
                    row.getCell(0, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL)).trim();
            if ("productCode".equalsIgnoreCase(firstCell) || "Mã sản phẩm".equalsIgnoreCase(firstCell)) {
                return rowIndex;
            }
        }
        return -1;
    }

    /**
     * Parse single CSV line (handles quoted values)
     */
    private ProductImportRequest parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        values.add(current.toString().trim());

        // Pad with empty strings if needed
        while (values.size() < 8) {
            values.add("");
        }

        return toImportRequest(values);
    }

    private ProductImportRequest toImportRequest(List<String> values) {
        return ProductImportRequest.builder()
                .productCode(getOrNull(values, 0))
                .productName(getOrNull(values, 1))
                .categoryCode(getOrNull(values, 2))
                .baseUnitCode(getOrNull(values, 3))
                .salePrice(parseDecimal(getOrNull(values, 4)))
                .quantityOnHand(parseDecimal(getOrNull(values, 5)))
                .status(normalizeStatus(getOrNull(values, 6)))
                .description(getOrNull(values, 7))
                .build();
    }

    /**
     * Generate the Excel template with the same layout as the provided sample.
     */
    public byte[] generateTemplate() {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Mẫu nhập sản phẩm");

            writeRow(sheet, 0, "# TỆP MẪU NHẬP SẢN PHẨM");
            writeRow(sheet, 1, "# Hướng dẫn:");
            writeRow(sheet, 2, "# - Dòng này là dòng tiêu đề", " không sửa");
            writeRow(sheet, 3, "# - Xóa các dòng mẫu (bắt đầu bằng SP) trước khi nhập dữ liệu");
            writeRow(sheet, 4, "# - Mã danh mục", " Trạng thái", " Mô tả là các cột tùy chọn");
            writeRow(sheet, 5, "# - Nếu giá trị chứa dấu phẩy", " đặt trong dấu ngoặc kép \"\"");
            writeRow(sheet, 6);
            writeRow(sheet, 7, "Mã sản phẩm", "Tên sản phẩm", "Mã danh mục", "Mã đơn vị tính",
                    "Giá bán", "Số lượng tồn kho", "Trạng thái", "Mô tả");
            writeRow(sheet, 8, "# Ví dụ:");
            writeRow(sheet, 9, "SP001", "Rong Biển Ăn Liền", null, "CAI", 15000, 100,
                    "Đang hoạt động", "Rong biển ăn liền vị cay");
            writeRow(sheet, 10, "SP002", "Nước Ngọt Cola", null, "CHAI", 12000, 50,
                    "Đang hoạt động", "Nước giải khát có ga");
            writeRow(sheet, 11, "SP003", "Bánh Gạo", "THUC_PHAM", "GOI", 25000, 200,
                    "Đang hoạt động", "Bánh gạo Hàn Quốc");

            int[] columnWidths = {55, 32, 32, 18, 16, 20, 16, 40};
            for (int columnIndex = 0; columnIndex < columnWidths.length; columnIndex++) {
                sheet.setColumnWidth(columnIndex, columnWidths[columnIndex] * 256);
            }

            workbook.write(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Không thể tạo tệp mẫu", e);
        }
    }

    private void writeRow(Sheet sheet, int rowIndex, Object... values) {
        Row row = sheet.createRow(rowIndex);
        for (int columnIndex = 0; columnIndex < values.length; columnIndex++) {
            Object value = values[columnIndex];
            if (value instanceof Number number) {
                row.createCell(columnIndex).setCellValue(number.doubleValue());
            } else if (value != null) {
                row.createCell(columnIndex).setCellValue(value.toString());
            }
        }
    }

    private String getOrNull(List<String> list, int index) {
        if (index >= list.size()) return null;
        String val = list.get(index);
        return (val == null || val.isEmpty() || "NULL".equalsIgnoreCase(val)) ? null : val;
    }

    private String normalizeStatus(String value) {
        if (value == null || value.isBlank()) return value;

        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "ĐANG HOẠT ĐỘNG", "DANG HOAT DONG", "HOẠT ĐỘNG", "HOAT DONG" -> "ACTIVE";
            case "NGỪNG HOẠT ĐỘNG", "NGUNG HOAT DONG", "TẠM NGỪNG", "TAM NGUNG" -> "INACTIVE";
            default -> value;
        };
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isEmpty()) return null;
        try {
            return new BigDecimal(value.replace(",", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
