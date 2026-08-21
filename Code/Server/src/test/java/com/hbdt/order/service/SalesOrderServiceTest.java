package com.hbdt.order.service;

import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.User;
import com.hbdt.inventory.service.InventoryMovementService;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesOrderServiceTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private SalesOrderItemRepository salesOrderItemRepository;
    @Mock private ProductPricingService productPricingService;
    @Mock private BusinessContextService businessContextService;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private InventoryMovementService inventoryMovementService;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(
                salesOrderRepository, salesOrderItemRepository, productPricingService,
                businessContextService, userRepository, productRepository, unitRepository,
                inventoryMovementService
        );
    }

    @Test
    void createKeepsDifferentUnitsAndMergesOnlyExactDuplicateLines() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-001"))
                .thenReturn(false);
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(invocation -> {
                    SalesOrderItem item = invocation.getArgument(1);
                    BigDecimal unitPrice = item.getUnitId().equals(2L)
                            ? new BigDecimal("15000.00")
                            : new BigDecimal("180000.00");
                    BigDecimal rate = item.getUnitId().equals(2L)
                            ? BigDecimal.ONE
                            : new BigDecimal("10");
                    item.setConversionRate(rate);
                    item.setBaseQuantity(item.getQuantity().multiply(rate));
                    item.setUnitPrice(unitPrice);
                    item.setLineTotal(item.getQuantity().multiply(unitPrice));
                    item.setProductPriceId(40L);
                    item.setPricingRuleName("Giá bán");
                    return item;
                });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> {
            SalesOrder order = invocation.getArgument(0);
            order.setId(100L);
            return order;
        });
        when(salesOrderItemRepository.saveAll(any())).thenAnswer(invocation -> {
            List<SalesOrderItem> items = invocation.getArgument(0);
            for (int index = 0; index < items.size(); index++) {
                items.get(index).setId(101L + index);
            }
            return items;
        });
        when(productRepository.findById(10L)).thenReturn(Optional.of(
                com.hbdt.entity.Product.builder().id(10L).productName("Gạo").build()
        ));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(
                com.hbdt.entity.Unit.builder().id(2L).unitName("Cái").build()
        ));
        when(unitRepository.findById(3L)).thenReturn(Optional.of(
                com.hbdt.entity.Unit.builder().id(3L).unitName("Bao").build()
        ));

        SalesOrderResponse response = service.create("owner", new CreateSalesOrderRequest(
                " SO-001 ", null, "POS", new BigDecimal("100000"), null,
                List.of(
                        new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null),
                        new CreateSalesOrderItemRequest(10L, 3L, new BigDecimal("10"), null),
                        new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null)
                )
        ));

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.totalAmount()).isEqualByComparingTo("1830000.00");
        assertThat(response.paidAmount()).isEqualByComparingTo("100000.00");
        assertThat(response.debtAmount()).isEqualByComparingTo("1730000.00");
        assertThat(response.items()).hasSize(2);
        verify(inventoryMovementService, times(2)).stockOut(eq("owner"), any());
        assertThat(response.items().get(0).unitId()).isEqualTo(2L);
        assertThat(response.items().get(0).quantity()).isEqualByComparingTo("2");
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("15000.00");
        assertThat(response.items().get(1).unitId()).isEqualTo(3L);
        assertThat(response.items().get(1).quantity()).isEqualByComparingTo("10");
        assertThat(response.items().get(0).productPriceId()).isEqualTo(40L);
        assertThat(response.items().get(0).pricingRuleName()).isEqualTo("Giá bán");
    }
}
