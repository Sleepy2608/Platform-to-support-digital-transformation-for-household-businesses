package com.hbdt.imports.service;

import com.hbdt.entity.Unit;
import com.hbdt.imports.dto.ProductImportResponse;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
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
    private ProductImportService service;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
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

        service = new ProductImportService(
                productRepository,
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
                1L, csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

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
                1L, csv.getBytes(StandardCharsets.UTF_8), "san-pham.csv");

        assertEquals(1, response.getFailedCount());
        assertTrue(response.getErrors().stream().anyMatch(error ->
                "productCode".equals(error.getField())
                        && error.getErrorMessage().contains("50 ký tự")));
        verify(productRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void importMethodIsTransactional() throws Exception {
        Method method = ProductImportService.class.getMethod(
                "importProducts", Long.class, byte[].class, String.class);
        assertTrue(method.isAnnotationPresent(Transactional.class));
    }
}
