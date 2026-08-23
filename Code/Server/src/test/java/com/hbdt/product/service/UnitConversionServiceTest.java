package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UnitConversionServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductUnitRepository productUnitRepository;
    @Mock
    private BusinessContextService businessContextService;

    private UnitConversionService unitConversionService;

    @BeforeEach
    void setUp() {
        unitConversionService = new UnitConversionService(
                productRepository,
                productUnitRepository,
                businessContextService
        );
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void convertsAlternateUnitToBaseQuantity() {
        Product product = product();
        ProductUnit box = ProductUnit.builder()
                .productId(15L)
                .unitId(3L)
                .conversionRate(new BigDecimal("10"))
                .status("ACTIVE")
                .build();
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(15L, 3L, "ACTIVE"))
                .thenReturn(Optional.of(box));

        BigDecimal result = unitConversionService.toBaseQuantity(
                "owner", 15L, 3L, new BigDecimal("3")
        );

        assertEquals(new BigDecimal("30.000"), result);
    }

    @Test
    void convertsBetweenConfiguredUnitsThroughBaseUnit() {
        Product product = product();
        ProductUnit box = ProductUnit.builder()
                .productId(15L)
                .unitId(3L)
                .conversionRate(new BigDecimal("10"))
                .status("ACTIVE")
                .build();
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(15L, 3L, "ACTIVE"))
                .thenReturn(Optional.of(box));

        BigDecimal result = unitConversionService.convert(
                "owner", 15L, 3L, 1L, new BigDecimal("2")
        );

        assertEquals(new BigDecimal("20.000"), result);
    }

    @Test
    void rejectsInactiveOrUnconfiguredUnit() {
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product()));
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(15L, 3L, "ACTIVE"))
                .thenReturn(Optional.empty());

        BadRequestException error = assertThrows(BadRequestException.class, () ->
                unitConversionService.toBaseQuantity("owner", 15L, 3L, BigDecimal.ONE)
        );

        assertEquals("Đơn vị tính không được cấu hình hoặc đã bị vô hiệu hóa", error.getMessage());
    }

    private Product product() {
        return Product.builder()
                .id(15L)
                .businessId(10L)
                .baseUnitId(1L)
                .status("ACTIVE")
                .build();
    }
}
