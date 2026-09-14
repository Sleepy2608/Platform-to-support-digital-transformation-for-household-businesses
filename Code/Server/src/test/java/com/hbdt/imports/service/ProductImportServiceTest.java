package com.hbdt.imports.service;

import com.hbdt.entity.Product;
import com.hbdt.entity.ProductPrice;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.imports.dto.ProductImportResponse;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductPriceRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import org.mockito.ArgumentCaptor;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductImportServiceTest {

    private ProductRepository productRepository;
    private ProductUnitRepository productUnitRepository;
    private ProductPriceRepository productPriceRepository;
    private ProductImportService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productUnitRepository = mock(ProductUnitRepository.class);
        productPriceRepository = mock(ProductPriceRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        UnitRepository unitRepository = mock(UnitRepository.class);
        InventoryBalanceRepository inventoryBalanceRepository = mock(InventoryBalanceRepository.class);
        ProductImportErrorReportGenerator errorReportGenerator = new ProductImportErrorReportGenerator();
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

        when(categoryRepository.findAll()).thenReturn(List.of());
        when(unitRepository.findAll()).thenReturn(List.of(
                Unit.builder().id(1L).unitCode("CAI").unitName("Cái").build()));
        when(productRepository.existsByBusinessIdAndProductCodeIgnoreCase(eq(1L), anyString()))
                .thenReturn(false);
        when(productRepository.saveAll(org.mockito.ArgumentMatchers.<Product>anyList()))
                .thenAnswer(invocation -> {
                    List<Product> products = invocation.getArgument(0);
                    for (int i = 0; i < products.size(); i++) {
                        products.get(i).setId((long) i + 1);
                    }
                    return products;
                });
        when(productUnitRepository.saveAll(org.mockito.ArgumentMatchers.<ProductUnit>anyList()))
                .thenAnswer(invocation -> {
                    List<ProductUnit> productUnits = invocation.getArgument(0);
                    for (int i = 0; i < productUnits.size(); i++) {
                        productUnits.get(i).setId((long) i + 101);
                    }
                    return productUnits;
                });

        service = new ProductImportService(
                productRepository,
                productUnitRepository,
                productPriceRepository,
                categoryRepository,
                unitRepository,
                inventoryBalanceRepository,
                new ProductImportFileParser(),
                errorReportGenerator,
                validator);
    }

    @Test
    void invalidNumbersAreReportedAndDoNotCreateProducts() {
        String csv = "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả\n"
                + "SP001,Sản phẩm lỗi,,CAI,abc,xyz,Đang hoạt động,Mô tả\n";

        ProductImportResponse response = service.importProducts(
                1L, 99L, csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getFailedCount());
        assertEquals(2, response.getErrorCount());
        assertTrue(response.getErrors().stream().anyMatch(error -> "salePrice".equals(error.getField())));
        assertTrue(response.getErrors().stream().anyMatch(error -> "quantityOnHand".equals(error.getField())));
        verify(productRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void beanValidationRejectsFieldsThatExceedConfiguredLength() {
        String longCode = "SP" + "X".repeat(49);
        String csv = "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả\n"
                + longCode + ",Sản phẩm lỗi,,CAI,1000,1,Đang hoạt động,Mô tả\n";

        ProductImportResponse response = service.importProducts(
                1L, 99L, csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(1, response.getFailedCount());
        assertTrue(response.getErrors().stream().anyMatch(error ->
                "productCode".equals(error.getField())
                        && error.getErrorMessage().contains("50 ký tự")));
        verify(productRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void importMethodIsTransactional() throws Exception {
        Method method = ProductImportService.class.getMethod(
                "importProducts", Long.class, Long.class, byte[].class, String.class);
        assertTrue(method.isAnnotationPresent(Transactional.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void xlsxImportStoresSalePriceOnProduct() throws Exception {
        byte[] workbookBytes;
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Sản phẩm");
            var header = sheet.createRow(0);
            String[] headers = {"Mã sản phẩm", "Tên sản phẩm", "Mã danh mục", "Mã đơn vị tính",
                    "Giá bán", "Số lượng tồn kho", "Trạng thái", "Mô tả"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            var row = sheet.createRow(1);
            row.createCell(0).setCellValue("SP-XLSX-01");
            row.createCell(1).setCellValue("Nước Ngọt Cola");
            row.createCell(3).setCellValue("CAI");
            row.createCell(4).setCellValue(12000);
            row.createCell(5).setCellValue(48);
            row.createCell(6).setCellValue("Đang hoạt động");
            workbook.write(output);
            workbookBytes = output.toByteArray();
        }

        ProductImportResponse response = service.importProducts(1L, 99L, workbookBytes, "san-pham.xlsx");

        assertEquals(1, response.getSuccessCount());
        ArgumentCaptor<List<Product>> productsCaptor = ArgumentCaptor.forClass(List.class);
        verify(productRepository).saveAll(productsCaptor.capture());
        Product imported = productsCaptor.getValue().get(0);
        assertEquals("SP-XLSX-01", imported.getProductCode());
        assertEquals(new BigDecimal("12000"), imported.getSalePrice());
        assertEquals(1L, imported.getBaseUnitId());

        ArgumentCaptor<List<ProductUnit>> unitsCaptor = ArgumentCaptor.forClass(List.class);
        verify(productUnitRepository).saveAll(unitsCaptor.capture());
        ProductUnit importedUnit = unitsCaptor.getValue().get(0);
        assertEquals(imported.getId(), importedUnit.getProductId());
        assertEquals(1L, importedUnit.getUnitId());
        assertEquals(BigDecimal.ONE, importedUnit.getConversionRate());
        assertTrue(importedUnit.getBaseUnit());

        ArgumentCaptor<List<ProductPrice>> pricesCaptor = ArgumentCaptor.forClass(List.class);
        verify(productPriceRepository).saveAll(pricesCaptor.capture());
        ProductPrice importedPrice = pricesCaptor.getValue().get(0);
        assertEquals(importedUnit.getId(), importedPrice.getProductUnitId());
        assertEquals(new BigDecimal("12000"), importedPrice.getSalePrice());
        assertEquals(99L, importedPrice.getChangedBy());
        assertEquals("ACTIVE", importedPrice.getStatus());
    }

    @Test
    void importRejectsBlankSalePrice() {
        String csv = "Mã sản phẩm,Tên sản phẩm,Mã danh mục,Mã đơn vị tính,Giá bán,Số lượng tồn kho,Trạng thái,Mô tả\n"
                + "SP-NO-PRICE,Sản phẩm thiếu giá,,CAI,,1,Đang hoạt động,Mô tả\n";

        ProductImportResponse response = service.importProducts(
                1L, 99L, csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getFailedCount());
        assertTrue(response.getErrors().stream().anyMatch(error ->
                "salePrice".equals(error.getField())
                        && error.getErrorMessage().contains("không được để trống")));
        verify(productRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
        verify(productUnitRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
        verify(productPriceRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }
}
