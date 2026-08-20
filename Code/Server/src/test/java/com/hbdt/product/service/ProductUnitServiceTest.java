package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.ProductUnitRequest;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.dto.UpdateProductUnitRequest;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductUnitServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductUnitRepository productUnitRepository;
    @Mock
    private BusinessContextService businessContextService;
    @Mock
    private UnitRepository unitRepository;
    @Mock
    private ProductPricingService productPricingService;

    private ProductUnitService productUnitService;

    @BeforeEach
    void setUp() {
        productUnitService = new ProductUnitService(
                productRepository,
                productUnitRepository,
                businessContextService,
                unitRepository,
                productPricingService
        );
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void addUnitCreatesNewActiveConfiguration() {
        Product product = product(15L, 1L);
        Unit unit = Unit.builder().id(3L).unitCode("THUNG").unitName("Thùng").status("ACTIVE").build();
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.of(unit));
        when(productUnitRepository.findByProductIdAndUnitId(15L, 3L)).thenReturn(Optional.empty());
        when(productUnitRepository.save(any(ProductUnit.class))).thenAnswer(invocation -> {
            ProductUnit value = invocation.getArgument(0);
            value.setId(8L);
            return value;
        });
        when(unitRepository.findById(3L)).thenReturn(Optional.of(unit));

        ProductUnitResponse response = productUnitService.addUnit(
                "owner", 15L, new ProductUnitRequest(3L, new BigDecimal("10"))
        );

        assertEquals(8L, response.getId());
        assertEquals("Thùng", response.getUnitName());
        assertEquals(new BigDecimal("10"), response.getConversionRate());
        assertFalse(response.getBaseUnit());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void addUnitRejectsDuplicateActiveConfiguration() {
        Product product = product(15L, 1L);
        Unit unit = Unit.builder().id(3L).status("ACTIVE").build();
        ProductUnit existing = productUnit(8L, 15L, 3L, "10", false, "ACTIVE");
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.of(unit));
        when(productUnitRepository.findByProductIdAndUnitId(15L, 3L)).thenReturn(Optional.of(existing));

        BadRequestException error = assertThrows(BadRequestException.class, () ->
                productUnitService.addUnit("owner", 15L, new ProductUnitRequest(3L, new BigDecimal("12")))
        );

        assertEquals("Đơn vị tính đã được cấu hình cho sản phẩm", error.getMessage());
        verify(productUnitRepository, never()).save(any(ProductUnit.class));
    }

    @Test
    void addUnitReactivatesInactiveConfiguration() {
        Product product = product(15L, 1L);
        Unit unit = Unit.builder().id(3L).unitCode("THUNG").unitName("Thùng").status("ACTIVE").build();
        ProductUnit existing = productUnit(8L, 15L, 3L, "10", false, "INACTIVE");
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.of(unit));
        when(productUnitRepository.findByProductIdAndUnitId(15L, 3L)).thenReturn(Optional.of(existing));
        when(productUnitRepository.save(existing)).thenReturn(existing);
        when(unitRepository.findById(3L)).thenReturn(Optional.of(unit));

        ProductUnitResponse response = productUnitService.addUnit(
                "owner", 15L, new ProductUnitRequest(3L, new BigDecimal("12"))
        );

        assertEquals("ACTIVE", response.getStatus());
        assertEquals(new BigDecimal("12"), response.getConversionRate());
    }

    @Test
    void updateRateRejectsBaseUnit() {
        Product product = product(15L, 1L);
        ProductUnit base = productUnit(7L, 15L, 1L, "1", true, "ACTIVE");
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(productUnitRepository.findByIdAndProductId(7L, 15L)).thenReturn(Optional.of(base));

        BadRequestException error = assertThrows(BadRequestException.class, () ->
                productUnitService.updateRate("owner", 15L, 7L, new UpdateProductUnitRequest(new BigDecimal("2")))
        );

        assertEquals("Không thể thay đổi tỷ lệ của đơn vị chuẩn", error.getMessage());
        verify(productUnitRepository, never()).save(any(ProductUnit.class));
    }

    @Test
    void deactivateUsesSoftDelete() {
        Product product = product(15L, 1L);
        ProductUnit alternate = productUnit(8L, 15L, 3L, "10", false, "ACTIVE");
        when(productRepository.findByIdAndBusinessId(15L, 10L)).thenReturn(Optional.of(product));
        when(productUnitRepository.findByIdAndProductId(8L, 15L)).thenReturn(Optional.of(alternate));

        productUnitService.deactivate("owner", 15L, 8L);

        assertEquals("INACTIVE", alternate.getStatus());
        verify(productUnitRepository).save(alternate);
    }

    private Product product(Long id, Long baseUnitId) {
        return Product.builder()
                .id(id)
                .businessId(10L)
                .baseUnitId(baseUnitId)
                .status("ACTIVE")
                .build();
    }

    private ProductUnit productUnit(
            Long id,
            Long productId,
            Long unitId,
            String rate,
            boolean baseUnit,
            String status
    ) {
        return ProductUnit.builder()
                .id(id)
                .productId(productId)
                .unitId(unitId)
                .conversionRate(new BigDecimal(rate))
                .baseUnit(baseUnit)
                .status(status)
                .build();
    }
}
