package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.ProductRequest;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.TaxActivityGroupRepository;
import com.hbdt.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductUnitRepository productUnitRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UnitRepository unitRepository;
    @Mock
    private InventoryBalanceRepository inventoryBalanceRepository;
    @Mock
    private TaxActivityGroupRepository taxActivityGroupRepository;
    @Mock
    private BusinessContextService businessContextService;
    @Mock
    private ProductImageService productImageService;
    @Mock
    private ImageStorageService imageStorageService;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, productUnitRepository, categoryRepository, unitRepository,
                inventoryBalanceRepository, taxActivityGroupRepository, businessContextService,
                productImageService, imageStorageService);
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void createUsesOwnedActiveCategoryAndActiveUnit() {
        ProductRequest request = new ProductRequest(
                " SP-01 ", " Cà phê ", 2L, 3L, null, null, "Mô tả", null, new BigDecimal("25"));
        Category category = Category.builder().id(2L).businessId(10L).categoryName("Đồ uống").status("ACTIVE").build();
        Unit unit = Unit.builder().id(3L).unitCode("KG").unitName("Kilogram").status("ACTIVE").build();
        when(categoryRepository.findByIdAndBusinessId(2L, 10L)).thenReturn(Optional.of(category));
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.of(unit));
        when(unitRepository.findById(3L)).thenReturn(Optional.of(unit));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product value = invocation.getArgument(0);
            value.setId(8L);
            return value;
        });

        ProductResponse response = productService.create("owner", request);

        assertEquals(8L, response.id());
        assertEquals("SP-01", response.productCode());
        assertEquals("Cà phê", response.productName());
        assertEquals("Đồ uống", response.categoryName());
        assertEquals("Kilogram", response.baseUnitName());
        assertEquals("ACTIVE", response.status());
        ArgumentCaptor<InventoryBalance> balanceCaptor = ArgumentCaptor.forClass(InventoryBalance.class);
        verify(inventoryBalanceRepository).save(balanceCaptor.capture());
        assertEquals(new BigDecimal("25"), balanceCaptor.getValue().getQuantityOnHand());
        ArgumentCaptor<ProductUnit> unitCaptor = ArgumentCaptor.forClass(ProductUnit.class);
        verify(productUnitRepository).save(unitCaptor.capture());
        assertEquals(3L, unitCaptor.getValue().getUnitId());
        assertEquals(BigDecimal.ONE, unitCaptor.getValue().getConversionRate());
        assertEquals(true, unitCaptor.getValue().getBaseUnit());
    }

    @Test
    void createAcceptsQuantityAndCreatesDefaultUnitWhenUnitsAreEmpty() {
        ProductRequest request = new ProductRequest(
                "SP-02", "Bánh mì", null, null, null, null, null, "ACTIVE", new BigDecimal("12"));
        Unit defaultUnit = Unit.builder().id(4L).unitCode("SAN_PHAM").unitName("Sản phẩm").status("ACTIVE").build();
        when(unitRepository.findAllByStatusOrderByUnitNameAsc("ACTIVE")).thenReturn(List.of());
        when(unitRepository.findFirstByUnitCodeIgnoreCase("SAN_PHAM")).thenReturn(Optional.empty());
        when(unitRepository.save(any(Unit.class))).thenReturn(defaultUnit);
        when(unitRepository.findByIdAndStatus(4L, "ACTIVE")).thenReturn(Optional.of(defaultUnit));
        when(unitRepository.findById(4L)).thenReturn(Optional.of(defaultUnit));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product value = invocation.getArgument(0);
            value.setId(9L);
            return value;
        });

        ProductResponse response = productService.create("owner", request);

        assertEquals(4L, response.baseUnitId());
        assertEquals("Sản phẩm", response.baseUnitName());
        ArgumentCaptor<InventoryBalance> balanceCaptor = ArgumentCaptor.forClass(InventoryBalance.class);
        verify(inventoryBalanceRepository).save(balanceCaptor.capture());
        assertEquals(new BigDecimal("12"), balanceCaptor.getValue().getQuantityOnHand());
    }

    @Test
    void createAcceptsFractionalProductQuantity() {
        ProductRequest request = new ProductRequest(
                "SP-03", "Nước suối", null, null, null, null, null, "ACTIVE", new BigDecimal("0.99"));
        Unit defaultUnit = Unit.builder().id(4L).unitCode("LIT").unitName("Lít").status("ACTIVE").build();
        when(unitRepository.findAllByStatusOrderByUnitNameAsc("ACTIVE")).thenReturn(List.of(defaultUnit));
        when(unitRepository.findByIdAndStatus(4L, "ACTIVE")).thenReturn(Optional.of(defaultUnit));
        when(unitRepository.findById(4L)).thenReturn(Optional.of(defaultUnit));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product value = invocation.getArgument(0);
            value.setId(10L);
            return value;
        });

        productService.create("owner", request);

        ArgumentCaptor<InventoryBalance> balanceCaptor = ArgumentCaptor.forClass(InventoryBalance.class);
        verify(inventoryBalanceRepository).save(balanceCaptor.capture());
        assertEquals(new BigDecimal("0.99"), balanceCaptor.getValue().getQuantityOnHand());
    }

    @Test
    void createRejectsCategoryFromAnotherBusiness() {
        ProductRequest request = new ProductRequest(
                "SP-01", "Cà phê", 99L, 3L, null, null, null, "ACTIVE", BigDecimal.ZERO);
        when(categoryRepository.findByIdAndBusinessId(99L, 10L)).thenReturn(Optional.empty());

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> productService.create("owner", request));

        assertEquals("Danh mục không thuộc hộ kinh doanh hiện tại", error.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createRejectsInactiveUnit() {
        ProductRequest request = new ProductRequest(
                "SP-01", "Cà phê", null, 3L, null, null, null, "ACTIVE", BigDecimal.ZERO);
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.empty());

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> productService.create("owner", request));

        assertEquals("Đơn vị tính không tồn tại hoặc đã bị vô hiệu hóa", error.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void deactivatePerformsSoftDeleteWithinBusiness() {
        Product product = Product.builder()
                .id(8L)
                .businessId(10L)
                .productCode("SP-01")
                .productName("Cà phê")
                .baseUnitId(3L)
                .status("ACTIVE")
                .build();
        when(productRepository.findByIdAndBusinessId(8L, 10L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        ProductResponse response = productService.deactivate("owner", 8L);

        assertEquals("INACTIVE", response.status());
        verify(productRepository).findByIdAndBusinessId(8L, 10L);
        verify(productRepository).save(product);
    }
}
