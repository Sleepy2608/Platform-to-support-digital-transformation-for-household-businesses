package com.hbdt.order.service;

import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.User;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesOrderServiceTest {

    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private SalesOrderItemRepository salesOrderItemRepository;
    @Mock private ProductPricingService productPricingService;
    @Mock private BusinessContextService businessContextService;
    @Mock private UserRepository userRepository;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(
                salesOrderRepository, salesOrderItemRepository, productPricingService,
                businessContextService, userRepository
        );
    }

    @Test
    void createSnapshotsResolvedPriceIntoPersistedOrderItem() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-001"))
                .thenReturn(false);
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(invocation -> {
                    SalesOrderItem item = invocation.getArgument(1);
                    item.setConversionRate(new BigDecimal("10"));
                    item.setBaseQuantity(new BigDecimal("20.000"));
                    item.setUnitPrice(new BigDecimal("150000.00"));
                    item.setLineTotal(new BigDecimal("300000.00"));
                    item.setProductPriceId(40L);
                    item.setPricingRuleName("Giá mặc định");
                    return item;
                });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> {
            SalesOrder order = invocation.getArgument(0);
            order.setId(100L);
            return order;
        });
        when(salesOrderItemRepository.saveAll(any())).thenAnswer(invocation -> {
            List<SalesOrderItem> items = invocation.getArgument(0);
            items.get(0).setId(101L);
            return items;
        });

        SalesOrderResponse response = service.create("owner", new CreateSalesOrderRequest(
                " SO-001 ", null, "POS", new BigDecimal("100000"), null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, new BigDecimal("2"), null))
        ));

        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.totalAmount()).isEqualByComparingTo("300000.00");
        assertThat(response.paidAmount()).isEqualByComparingTo("100000.00");
        assertThat(response.debtAmount()).isEqualByComparingTo("200000.00");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("150000.00");
        assertThat(response.items().get(0).productPriceId()).isEqualTo(40L);
        assertThat(response.items().get(0).pricingRuleName()).isEqualTo("Giá mặc định");
    }
}
