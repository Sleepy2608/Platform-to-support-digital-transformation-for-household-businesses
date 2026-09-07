package com.hbdt.inventory.service;

import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.inventory.dto.CurrentStockBalanceResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentStockBalanceServiceTest {

    @Mock private BusinessContextService businessContextService;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryBalanceRepository balanceRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UnitRepository unitRepository;

    private CurrentStockBalanceService service;

    @BeforeEach
    void setUp() {
        service = new CurrentStockBalanceService(
                businessContextService,
                productRepository,
                balanceRepository,
                categoryRepository,
                unitRepository
        );
    }

    @Test
    void returnsActiveProductsMappedToExistingBusinessData() {
        Product product = Product.builder()
                .id(11L)
                .businessId(7L)
                .categoryId(3L)
                .baseUnitId(2L)
                .productCode("SP-01")
                .productName("Cà phê rang")
                .status("ACTIVE")
                .build();
        LocalDateTime updatedAt = LocalDateTime.of(2026, 8, 31, 9, 30);
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L)
                .productId(11L)
                .quantityOnHand(new BigDecimal("12.500"))
                .averageUnitCost(new BigDecimal("75000.00"))
                .inventoryValue(new BigDecimal("937500.00"))
                .updatedAt(updatedAt)
                .build();
        Category category = Category.builder()
                .id(3L)
                .businessId(7L)
                .categoryName("Đồ uống")
                .build();
        Unit unit = Unit.builder().id(2L).unitName("Kilôgam").status("ACTIVE").build();

        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(7L, "ACTIVE"))
                .thenReturn(List.of(product));
        when(balanceRepository.findAllByBusinessId(7L)).thenReturn(List.of(balance));
        when(categoryRepository.findAllByBusinessIdAndIdIn(7L, List.of(3L)))
                .thenReturn(List.of(category));
        when(unitRepository.findAllById(List.of(2L))).thenReturn(List.of(unit));

        List<CurrentStockBalanceResponse> result = service.getCurrentBalances("owner");

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.productId()).isEqualTo(11L);
            assertThat(item.productCode()).isEqualTo("SP-01");
            assertThat(item.categoryName()).isEqualTo("Đồ uống");
            assertThat(item.baseUnitName()).isEqualTo("Kilôgam");
            assertThat(item.quantityOnHand()).isEqualByComparingTo("12.500");
            assertThat(item.averageUnitCost()).isEqualByComparingTo("75000.00");
            assertThat(item.inventoryValue()).isEqualByComparingTo("937500.00");
            assertThat(item.updatedAt()).isEqualTo(updatedAt);
        });
        verify(balanceRepository).findAllByBusinessId(7L);
    }

    @Test
    void returnsZeroWithoutCreatingBalanceWhenProductHasNoMovement() {
        Product product = Product.builder()
                .id(12L)
                .businessId(7L)
                .baseUnitId(2L)
                .productCode("SP-02")
                .productName("Trà")
                .status("ACTIVE")
                .build();
        Unit unit = Unit.builder().id(2L).unitName("Hộp").status("ACTIVE").build();

        when(businessContextService.requireBusinessId("employee")).thenReturn(7L);
        when(productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(7L, "ACTIVE"))
                .thenReturn(List.of(product));
        when(balanceRepository.findAllByBusinessId(7L)).thenReturn(List.of());
        when(unitRepository.findAllById(List.of(2L))).thenReturn(List.of(unit));

        CurrentStockBalanceResponse result = service.getCurrentBalances("employee").getFirst();

        assertThat(result.quantityOnHand()).isEqualByComparingTo("0.000");
        assertThat(result.averageUnitCost()).isEqualByComparingTo("0.00");
        assertThat(result.inventoryValue()).isEqualByComparingTo("0.00");
        assertThat(result.updatedAt()).isNull();
    }
}
