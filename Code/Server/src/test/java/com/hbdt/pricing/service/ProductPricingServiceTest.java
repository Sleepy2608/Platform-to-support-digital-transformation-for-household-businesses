package com.hbdt.pricing.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductPrice;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.pricing.dto.ProductPriceRequest;
import com.hbdt.pricing.dto.ProductPriceResponse;
import com.hbdt.pricing.dto.ResolvePriceRequest;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import com.hbdt.pricing.dto.UpdateProductPriceRequest;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.ProductPriceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ProductPricingServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductUnitRepository productUnitRepository;
    @Mock private ProductPriceRepository productPriceRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessContextService businessContextService;

    private ProductPricingService service;

    @BeforeEach
    void setUp() {
        service = new ProductPricingService(
                productRepository, productUnitRepository, productPriceRepository,
                unitRepository, userRepository, businessContextService
        );
    }

    @Test
    void createStoresDefaultPriceForConfiguredUnit() {
        mockOwnedProduct();
        ProductUnit baseUnit = productUnit(20L, 1L, "1");
        when(productUnitRepository.findByIdAndProductId(20L, 10L)).thenReturn(Optional.of(baseUnit));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(20L, "ACTIVE"))
                .thenReturn(List.of());
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(productPriceRepository.save(any(ProductPrice.class))).thenAnswer(invocation -> {
            ProductPrice price = invocation.getArgument(0);
            price.setId(30L);
            return price;
        });
        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit(1L, "Cái")));

        ProductPriceResponse response = service.create(
                "owner", 10L, new ProductPriceRequest(20L, new BigDecimal("15000"), "")
        );

        assertThat(response.id()).isEqualTo(30L);
        assertThat(response.salePrice()).isEqualByComparingTo("15000.00");
        assertThat(response.ruleName()).isEqualTo("Giá bán");
        assertThat(response.changedBy()).isEqualTo(7L);
    }

    @Test
    void createRejectsSecondCurrentPriceForSameUnit() {
        mockOwnedProduct();
        ProductUnit baseUnit = productUnit(20L, 1L, "1");
        when(productUnitRepository.findByIdAndProductId(20L, 10L)).thenReturn(Optional.of(baseUnit));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(20L, "ACTIVE"))
                .thenReturn(List.of(price(40L, 20L, "15000")));

        assertThatThrownBy(() -> service.create(
                "owner", 10L, new ProductPriceRequest(20L, new BigDecimal("16000"), null)
        )).isInstanceOf(BadRequestException.class)
                .hasMessage("Đơn vị này đã có giá bán hiện hành");
    }

    @Test
    void resolveMultipliesOrderedQuantityByCurrentUnitPrice() {
        mockOwnedProduct();
        ProductUnit boxUnit = productUnit(21L, 2L, "10");
        ProductPrice wholesale = price(41L, 21L, "120000");
        wholesale.setRuleName("Giá sỉ");
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(10L, 2L, "ACTIVE"))
                .thenReturn(Optional.of(boxUnit));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(21L, "ACTIVE"))
                .thenReturn(List.of(wholesale));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(unit(2L, "Thùng")));

        ResolvedPriceResponse response = service.resolve(
                "owner", new ResolvePriceRequest(10L, 2L, new BigDecimal("6"))
        );

        assertThat(response.unitPrice()).isEqualByComparingTo("120000");
        assertThat(response.lineTotal()).isEqualByComparingTo("720000.00");
        assertThat(response.baseQuantity()).isEqualByComparingTo("60.000");
        assertThat(response.appliedRuleName()).isEqualTo("Giá sỉ");
        assertThat(response.convertedFromBasePrice()).isFalse();
    }

    @Test
    void snapshotOrderItemFallsBackToBasePriceAndKeepsResolvedValues() {
        mockOwnedProduct();
        ProductUnit boxUnit = productUnit(21L, 2L, "10");
        ProductUnit baseUnit = productUnit(20L, 1L, "1");
        ProductPrice basePrice = price(40L, 20L, "15000");
        basePrice.setRuleName("Giá mặc định");
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(10L, 2L, "ACTIVE"))
                .thenReturn(Optional.of(boxUnit));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(21L, "ACTIVE"))
                .thenReturn(List.of());
        when(productUnitRepository.findByProductIdAndUnitIdAndStatus(10L, 1L, "ACTIVE"))
                .thenReturn(Optional.of(baseUnit));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(20L, "ACTIVE"))
                .thenReturn(List.of(basePrice));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(unit(2L, "Thùng")));

        SalesOrderItem item = SalesOrderItem.builder()
                .productId(10L)
                .unitId(2L)
                .quantity(new BigDecimal("2"))
                .build();
        service.snapshotOrderItemPrice("owner", item);

        assertThat(item.getConversionRate()).isEqualByComparingTo("10");
        assertThat(item.getBaseQuantity()).isEqualByComparingTo("20.000");
        assertThat(item.getUnitPrice()).isEqualByComparingTo("150000.00");
        assertThat(item.getLineTotal()).isEqualByComparingTo("300000.00");
        assertThat(item.getProductPriceId()).isEqualTo(40L);
        assertThat(item.getPricingRuleName()).isEqualTo("Giá mặc định");
    }

    @Test
    void resolveRejectsFractionalOrderQuantity() {
        mockOwnedProduct();

        assertThatThrownBy(() -> service.resolve(
                "owner", new ResolvePriceRequest(10L, 2L, new BigDecimal("19.001"))
        ))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Số lượng đặt hàng phải là số nguyên");
    }

    @Test
    void updateCreatesNewVersionAndClosesOldPrice() {
        mockOwnedProduct();
        ProductUnit baseUnit = productUnit(20L, 1L, "1");
        ProductPrice current = price(40L, 20L, "15000");
        when(productPriceRepository.findById(40L)).thenReturn(Optional.of(current));
        when(productUnitRepository.findByIdAndProductId(20L, 10L)).thenReturn(Optional.of(baseUnit));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(20L, "ACTIVE"))
                .thenReturn(List.of(current));
        when(productPriceRepository.save(any(ProductPrice.class))).thenAnswer(invocation -> {
            ProductPrice saved = invocation.getArgument(0);
            if (saved.getId() == null) saved.setId(41L);
            return saved;
        });
        when(productUnitRepository.findById(20L)).thenReturn(Optional.of(baseUnit));
        when(unitRepository.findById(1L)).thenReturn(Optional.of(unit(1L, "Cái")));

        ProductPriceResponse response = service.update(
                "owner", 10L, 40L, new UpdateProductPriceRequest(new BigDecimal("17000"), "Giá mới")
        );

        assertThat(current.getStatus()).isEqualTo("INACTIVE");
        assertThat(current.getEffectiveTo()).isNotNull();
        assertThat(response.id()).isEqualTo(41L);
        assertThat(response.salePrice()).isEqualByComparingTo("17000.00");
        assertThat(response.status()).isEqualTo("ACTIVE");
    }

    @Test
    void synchronizeForRateChangeVersionsAndScalesCurrentPrices() {
        mockOwnedProduct();
        ProductPrice current = price(40L, 21L, "100000");
        current.setRuleName("Giá thùng");
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(productPriceRepository.findAllByProductUnitIdAndStatusOrderByEffectiveFromDesc(21L, "ACTIVE"))
                .thenReturn(List.of(current));
        when(productPriceRepository.save(any(ProductPrice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.synchronizeForRateChange(
                "owner", 10L, 21L, new BigDecimal("10"), new BigDecimal("20")
        );

        ArgumentCaptor<ProductPrice> captor = ArgumentCaptor.forClass(ProductPrice.class);
        verify(productPriceRepository, times(2)).save(captor.capture());
        ProductPrice replacement = captor.getAllValues().get(1);
        assertThat(current.getStatus()).isEqualTo("INACTIVE");
        assertThat(current.getEffectiveTo()).isNotNull();
        assertThat(replacement.getStatus()).isEqualTo("ACTIVE");
        assertThat(replacement.getSalePrice()).isEqualByComparingTo("200000.00");
        assertThat(replacement.getChangedBy()).isEqualTo(7L);
    }

    private void mockOwnedProduct() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(productRepository.findByIdAndBusinessId(10L, 5L)).thenReturn(Optional.of(
                Product.builder().id(10L).businessId(5L).baseUnitId(1L).build()
        ));
    }

    private ProductUnit productUnit(Long id, Long unitId, String rate) {
        return ProductUnit.builder()
                .id(id).productId(10L).unitId(unitId).conversionRate(new BigDecimal(rate))
                .baseUnit(unitId.equals(1L)).status("ACTIVE").build();
    }

    private ProductPrice price(Long id, Long productUnitId, String salePrice) {
        return ProductPrice.builder()
                .id(id).productUnitId(productUnitId).minimumQuantity(new BigDecimal("1.000"))
                .salePrice(new BigDecimal(salePrice)).status("ACTIVE").build();
    }

    private Unit unit(Long id, String name) {
        return Unit.builder().id(id).unitName(name).unitCode(name.toUpperCase()).status("ACTIVE").build();
    }
}
