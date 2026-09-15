package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.inventory.service.LowStockAlertService;
import com.hbdt.entitlement.service.FeatureEntitlementService;
import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductPrice;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.ProductRequest;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductPriceRepository;
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
    private ProductPriceRepository productPriceRepository;
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
    @Mock
    private LowStockAlertService lowStockAlertService;
    @Mock
    private FeatureEntitlementService featureEntitlementService;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(productRepository, productUnitRepository, productPriceRepository,
                categoryRepository, unitRepository,
                inventoryBalanceRepository, taxActivityGroupRepository, businessContextService,
                productImageService, imageStorageService, featureEntitlementService, lowStockAlertService);
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void createUsesOwnedActiveCategoryAndDefaultUnit() {
        ProductRequest request = new ProductRequest(
                " SP-01 ", " Cà phê ", 2L, null, null, "Mô tả", null, new BigDecimal("25"));
        Category category = Category.builder().id(2L).businessId(10L).categoryName("Đồ uống").status("ACTIVE").build();
        Unit unit = Unit.builder().id(3L).unitCode("SAN_PHAM").unitName("Sản phẩm").status("ACTIVE").build();
        when(categoryRepository.findByIdAndBusinessId(2L, 10L)).thenReturn(Optional.of(category));
        when(unitRepository.findFirstByUnitCodeIgnoreCase("SAN_PHAM")).thenReturn(Optional.of(unit));
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
        assertEquals("Sản phẩm", response.baseUnitName());
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
                "SP-02", "Bánh mì", null, null, null, null, "ACTIVE", new BigDecimal("12"));
        Unit defaultUnit = Unit.builder().id(4L).unitCode("SAN_PHAM").unitName("Sản phẩm").status("ACTIVE").build();
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
    void createRejectsFractionalProductQuantity() {
        ProductRequest request = new ProductRequest(
                "SP-03", "Nước suối", null, null, null, null, "ACTIVE", new BigDecimal("0.99"));

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> productService.create("owner", request));

        assertEquals("Số lượng sản phẩm phải là số nguyên", error.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createRejectsQuantityExceedingDatabaseIntegerCapacity() {
        ProductRequest request = new ProductRequest(
                "SP-04", "Nước ngọt", null, null, null, null, "ACTIVE",
                new BigDecimal("1000000000000000"));

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> productService.create("owner", request));

        assertEquals("Số lượng sản phẩm không được vượt quá 15 chữ số", error.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createRejectsCategoryFromAnotherBusiness() {
        ProductRequest request = new ProductRequest(
                "SP-01", "Cà phê", 99L, null, null, null, "ACTIVE", BigDecimal.ZERO);
        Unit defaultUnit = Unit.builder().id(3L).unitCode("SAN_PHAM").unitName("Sản phẩm").status("ACTIVE").build();
        when(unitRepository.findFirstByUnitCodeIgnoreCase("SAN_PHAM")).thenReturn(Optional.of(defaultUnit));
        when(categoryRepository.findByIdAndBusinessId(99L, 10L)).thenReturn(Optional.empty());

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> productService.create("owner", request));

        assertEquals("Danh mục không thuộc hộ kinh doanh hiện tại", error.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createReactivatesInactiveDefaultUnit() {
        ProductRequest request = new ProductRequest(
                "SP-01", "Cà phê", null, null, null, null, "ACTIVE", BigDecimal.ZERO);
        Unit defaultUnit = Unit.builder().id(3L).unitCode("SAN_PHAM").unitName("Sản phẩm").status("INACTIVE").build();
        when(unitRepository.findFirstByUnitCodeIgnoreCase("SAN_PHAM")).thenReturn(Optional.of(defaultUnit));
        when(unitRepository.save(defaultUnit)).thenReturn(defaultUnit);
        when(unitRepository.findByIdAndStatus(3L, "ACTIVE")).thenReturn(Optional.of(defaultUnit));
        when(unitRepository.findById(3L)).thenReturn(Optional.of(defaultUnit));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product value = invocation.getArgument(0);
            value.setId(10L);
            return value;
        });

        ProductResponse response = productService.create("owner", request);

        assertEquals("ACTIVE", defaultUnit.getStatus());
        assertEquals(3L, response.baseUnitId());
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
        verify(lowStockAlertService).synchronizeProductStatus(10L, 8L);
    }

    @Test
    void getUsesCurrentBaseUnitPriceInsteadOfLegacyProductPrice() {
        Product product = Product.builder()
                .id(16L)
                .businessId(10L)
                .productCode("SP_002")
                .productName("Laptop")
                .baseUnitId(1L)
                .salePrice(BigDecimal.ZERO)
                .status("ACTIVE")
                .build();
        ProductUnit baseUnit = ProductUnit.builder()
                .id(8L)
                .productId(16L)
                .unitId(1L)
                .baseUnit(true)
                .status("ACTIVE")
                .build();
        ProductPrice currentPrice = ProductPrice.builder()
                .id(9L)
                .productUnitId(8L)
                .salePrice(new BigDecimal("30000000.00"))
                .status("ACTIVE")
                .build();
        when(productRepository.findByIdAndBusinessId(16L, 10L)).thenReturn(Optional.of(product));
        when(productUnitRepository.findAllByProductIdAndStatusOrderByBaseUnitDesc(16L, "ACTIVE"))
                .thenReturn(java.util.List.of(baseUnit));
        when(productPriceRepository.findFirstByProductUnitIdAndStatusOrderByEffectiveFromDesc(8L, "ACTIVE"))
                .thenReturn(Optional.of(currentPrice));

        ProductResponse response = productService.get("owner", 16L);

        assertEquals(new BigDecimal("30000000.00"), response.salePrice());
        assertEquals(1L, response.saleUnitId());
    }

    @Test
    void getUsesConfiguredSalesUnitWhenDeclaredBaseUnitHasNoConfiguration() {
        Product product = Product.builder()
                .id(18L)
                .businessId(10L)
                .productCode("SP002")
                .productName("Nước Ngọt Cola")
                .baseUnitId(8L)
                .salePrice(new BigDecimal("12000.00"))
                .status("ACTIVE")
                .build();
        Unit bottle = Unit.builder().id(8L).unitName("Chai").status("ACTIVE").build();
        Unit productUnitName = Unit.builder().id(1L).unitName("Sản phẩm").status("ACTIVE").build();
        ProductUnit configuredSalesUnit = ProductUnit.builder()
                .id(11L)
                .productId(18L)
                .unitId(1L)
                .baseUnit(true)
                .status("ACTIVE")
                .build();
        ProductPrice currentPrice = ProductPrice.builder()
                .id(12L)
                .productUnitId(11L)
                .salePrice(new BigDecimal("10000.00"))
                .status("ACTIVE")
                .build();
        when(productRepository.findByIdAndBusinessId(18L, 10L)).thenReturn(Optional.of(product));
        when(unitRepository.findById(8L)).thenReturn(Optional.of(bottle));
        when(unitRepository.findById(1L)).thenReturn(Optional.of(productUnitName));
        when(productUnitRepository.findAllByProductIdAndStatusOrderByBaseUnitDesc(18L, "ACTIVE"))
                .thenReturn(java.util.List.of(configuredSalesUnit));
        when(productPriceRepository.findFirstByProductUnitIdAndStatusOrderByEffectiveFromDesc(11L, "ACTIVE"))
                .thenReturn(Optional.of(currentPrice));

        ProductResponse response = productService.get("owner", 18L);

        assertEquals(8L, response.baseUnitId());
        assertEquals("Chai", response.baseUnitName());
        assertEquals(new BigDecimal("10000.00"), response.salePrice());
        assertEquals(1L, response.saleUnitId());
        assertEquals("Sản phẩm", response.saleUnitName());
    }
}
