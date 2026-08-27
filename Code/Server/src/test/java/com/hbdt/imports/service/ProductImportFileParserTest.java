package com.hbdt.imports.service;

import com.hbdt.imports.dto.ProductImportRequest;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductImportFileParserTest {

    private final ProductImportFileParser parser = new ProductImportFileParser();

    @Test
    void generatedExcelTemplateMatchesExpectedLayoutAndCanBeParsed() throws Exception {
        byte[] template = parser.generateTemplate();

        assertTrue(template.length > 4);
        assertEquals('P', template[0]);
        assertEquals('K', template[1]);

        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(template))) {
            assertEquals(1, workbook.getNumberOfSheets());
            assertEquals("Mẫu nhập sản phẩm", workbook.getSheetAt(0).getSheetName());
            assertEquals("# TỆP MẪU NHẬP SẢN PHẨM",
                    workbook.getSheetAt(0).getRow(0).getCell(0).getStringCellValue());
            assertEquals("# Hướng dẫn:",
                    workbook.getSheetAt(0).getRow(1).getCell(0).getStringCellValue());
            assertEquals("Mã sản phẩm",
                    workbook.getSheetAt(0).getRow(7).getCell(0).getStringCellValue());
            assertEquals("Mô tả",
                    workbook.getSheetAt(0).getRow(7).getCell(7).getStringCellValue());
        }

        List<ProductImportRequest> rows = parser.parseFile(template, "product_import_template.xlsx");
        assertEquals(3, rows.size());
        assertEquals("SP001", rows.get(0).getProductCode());
        assertEquals("Rong Biển Ăn Liền", rows.get(0).getProductName());
        assertEquals("ACTIVE", rows.get(0).getStatus());
        assertEquals("CAI", rows.get(0).getBaseUnitCode());
        assertEquals("15000", rows.get(0).getSalePrice().toPlainString());
        assertEquals("100", rows.get(0).getQuantityOnHand().toPlainString());
    }

    @Test
    void csvParserFindsHeaderAfterInstructionRows() {
        String csv = "# FILE MẪU IMPORT SẢN PHẨM\n"
                + "# Hướng dẫn\n\n"
                + "productCode,productName,categoryCode,baseUnitCode,salePrice,quantityOnHand,status,description\n"
                + "# Vi du:\n"
                + "SP100,Sản phẩm thử nghiệm,NULL,CAI,25000,5,ACTIVE,Mô tả\n";

        List<ProductImportRequest> rows = parser.parseFile(
                csv.getBytes(StandardCharsets.UTF_8), "products.csv");

        assertEquals(1, rows.size());
        assertEquals("SP100", rows.get(0).getProductCode());
        assertEquals("Sản phẩm thử nghiệm", rows.get(0).getProductName());
    }

    @Test
    void csvParserAcceptsVietnameseHeadersAndStatus() {
        String csv = "# Hướng dẫn\n\n"
                + "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả\n"
                + "SP200,Sản phẩm tiếng Việt,,CAI,30000,8,Đang hoạt động,Mô tả có dấu\n";

        List<ProductImportRequest> rows = parser.parseFile(
                csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(1, rows.size());
        assertEquals("SP200", rows.get(0).getProductCode());
        assertEquals("Sản phẩm tiếng Việt", rows.get(0).getProductName());
        assertEquals("ACTIVE", rows.get(0).getStatus());
    }

    @Test
    void parserPreservesInvalidNumericValuesForRowValidation() {
        String csv = "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả\n"
                + "SP300,Sản phẩm lỗi,,CAI,không-phải-số,sai,Đang hoạt động,Mô tả\n";

        List<ProductImportRequest> rows = parser.parseFile(
                csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(1, rows.size());
        assertEquals(2, rows.get(0).getSourceRowNumber());
        assertEquals("không-phải-số", rows.get(0).getSalePriceRaw());
        assertEquals("sai", rows.get(0).getQuantityOnHandRaw());
        assertEquals(null, rows.get(0).getSalePrice());
        assertEquals(null, rows.get(0).getQuantityOnHand());
    }

    @Test
    void generatedCsvTemplateCanBeParsed() {
        byte[] template = parser.generateCsvTemplate();
        List<ProductImportRequest> rows = parser.parseFile(template, "mau_nhap_san_pham.csv");

        assertEquals(3, rows.size());
        assertEquals("SP001", rows.get(0).getProductCode());
        assertEquals("ACTIVE", rows.get(0).getStatus());
        assertEquals("HOP", rows.get(2).getBaseUnitCode());
        assertEquals(null, rows.get(2).getCategoryCode());
    }
}
