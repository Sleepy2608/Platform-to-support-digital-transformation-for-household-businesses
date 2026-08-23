package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryMovementServiceTest {

    @Mock private BusinessContextService businessContextService;
    @Mock private UnitConversionService unitConversionService;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private UserRepository userRepository;
    @Mock private InventoryBalanceRepository balanceRepository;
    @Mock private InventoryTransactionRepository transactionRepository;

    private InventoryMovementService service;

    @BeforeEach
    void setUp() {
        service = new InventoryMovementService(
                businessContextService, unitConversionService, productRepository,
                unitRepository, userRepository, balanceRepository, transactionRepository
        );
    }

    @Test
    void stockInConvertsEnteredQuantityAndUpdatesBalanceInBaseUnit() {
        mockContextAndConversion(new BigDecimal("2"), new BigDecimal("10"), new BigDecimal("20.000"));
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.empty());
        when(balanceRepository.save(any(InventoryBalance.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction transaction = invocation.getArgument(0);
            transaction.setId(99L);
            return transaction;
        });

        InventoryMovementResponse response = service.stockIn(
                "owner",
                new InventoryMovementRequest(
                        11L, 2L, new BigDecimal("2"), new BigDecimal("100"), 5L, "Nhập hàng"
                )
        );

        assertThat(response.baseQuantity()).isEqualByComparingTo("20.000");
        assertThat(response.balanceAfter()).isEqualByComparingTo("20.000");
        assertThat(response.averageUnitCost()).isEqualByComparingTo("10.00");
        assertThat(response.inventoryValue()).isEqualByComparingTo("200.00");
        assertThat(response.transactionType()).isEqualTo("STOCK_IN");
    }

    @Test
    void stockOutRejectsQuantityGreaterThanBaseBalance() {
        mockContextAndConversion(new BigDecimal("3"), new BigDecimal("10"), new BigDecimal("30.000"));
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(
                InventoryBalance.builder()
                        .businessId(7L)
                        .productId(11L)
                        .quantityOnHand(new BigDecimal("20.000"))
                        .averageUnitCost(new BigDecimal("10.00"))
                        .inventoryValue(new BigDecimal("200.00"))
                        .build()
        ));

        assertThatThrownBy(() -> service.stockOut(
                "owner",
                new InventoryMovementRequest(11L, 2L, new BigDecimal("3"), null, null, null)
        )).isInstanceOf(BadRequestException.class)
                .hasMessage("Số lượng xuất vượt quá số lượng tồn kho");
    }

    private void mockContextAndConversion(BigDecimal quantity, BigDecimal rate, BigDecimal baseQuantity) {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        Unit baseUnit = Unit.builder().id(1L).unitCode("BAO").unitName("Bao").status("ACTIVE").build();
        Unit enteredUnit = Unit.builder().id(2L).unitCode("THUNG").unitName("Thùng").status("ACTIVE").build();

        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(unitRepository.findByIdAndStatus(2L, "ACTIVE")).thenReturn(Optional.of(enteredUnit));
        when(unitRepository.findByIdAndStatus(1L, "ACTIVE")).thenReturn(Optional.of(baseUnit));
        when(unitConversionService.getConversionRate("owner", 11L, 2L)).thenReturn(rate);
        when(unitConversionService.toBaseQuantity("owner", 11L, 2L, quantity))
                .thenReturn(baseQuantity);
    }
}
