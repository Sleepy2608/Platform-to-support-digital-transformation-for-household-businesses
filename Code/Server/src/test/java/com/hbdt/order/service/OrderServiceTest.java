package com.hbdt.order.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.order.dto.CreateOrderRequest;
import com.hbdt.order.dto.OrderItemRequest;
import com.hbdt.order.dto.OrderResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;
    @Mock
    private InventoryBalanceRepository inventoryBalanceRepository;
    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UnitRepository unitRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessContextService businessContextService;

    private OrderService orderService;

    private User testUser;
    private Product testProduct;
    private InventoryBalance testBalance;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                salesOrderRepository,
                salesOrderItemRepository,
                inventoryBalanceRepository,
                inventoryTransactionRepository,
                productRepository,
                unitRepository,
                userRepository,
                businessContextService
        );

        testUser = User.builder().id(100L).username("owner").businessId(10L).build();
        testProduct = Product.builder()
                .id(1L)
                .businessId(10L)
                .productCode("SP-001")
                .productName("Sản phẩm mẫu")
                .baseUnitId(5L)
                .salePrice(new BigDecimal("50000"))
                .status("ACTIVE")
                .build();
        testBalance = InventoryBalance.builder()
                .id(10L)
                .businessId(10L)
                .productId(1L)
                .quantityOnHand(new BigDecimal("10"))
                .averageUnitCost(new BigDecimal("30000"))
                .inventoryValue(new BigDecimal("300000"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void createOrderSuccessDeductsInventoryAndRecordsTransaction() {
        CreateOrderRequest request = new CreateOrderRequest(
                "Khách Nguyễn Văn A",
                "Giao giờ hành chính",
                List.of(new OrderItemRequest(1L, new BigDecimal("3"), new BigDecimal("50000")))
        );

        when(productRepository.findByIdAndBusinessId(1L, 10L)).thenReturn(Optional.of(testProduct));
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(inventoryBalanceRepository.findByBusinessIdAndProductId(10L, 1L)).thenReturn(Optional.of(testBalance));
        when(unitRepository.findById(5L)).thenReturn(Optional.of(Unit.builder().id(5L).unitName("Cái").build()));

        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> {
            SalesOrder order = inv.getArgument(0);
            if (order.getId() == null) order.setId(1001L);
            return order;
        });
        when(salesOrderItemRepository.save(any(SalesOrderItem.class))).thenAnswer(inv -> {
            SalesOrderItem item = inv.getArgument(0);
            if (item.getId() == null) item.setId(5001L);
            return item;
        });

        OrderResponse response = orderService.createOrder("owner", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("150000"), response.totalAmount());
        assertEquals("CONFIRMED", response.status());

        // Verify inventory deducted from 10 to 7
        ArgumentCaptor<InventoryBalance> balanceCaptor = ArgumentCaptor.forClass(InventoryBalance.class);
        verify(inventoryBalanceRepository).save(balanceCaptor.capture());
        assertEquals(new BigDecimal("7"), balanceCaptor.getValue().getQuantityOnHand());
        assertEquals(new BigDecimal("210000.00"), balanceCaptor.getValue().getInventoryValue().setScale(2));

        // Verify transaction recorded
        ArgumentCaptor<InventoryTransaction> txCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(inventoryTransactionRepository).save(txCaptor.capture());
        assertEquals("SALE", txCaptor.getValue().getTransactionType());
        assertEquals(new BigDecimal("-3"), txCaptor.getValue().getQuantityChange());
        assertEquals(new BigDecimal("7"), txCaptor.getValue().getBalanceAfter());
    }

    @Test
    void createOrderFailsWhenStockIsInsufficient() {
        CreateOrderRequest request = new CreateOrderRequest(
                "Khách B",
                null,
                List.of(new OrderItemRequest(1L, new BigDecimal("15"), new BigDecimal("50000")))
        );

        when(productRepository.findByIdAndBusinessId(1L, 10L)).thenReturn(Optional.of(testProduct));
        when(inventoryBalanceRepository.findByBusinessIdAndProductId(10L, 1L)).thenReturn(Optional.of(testBalance));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> orderService.createOrder("owner", request));
        assertEquals(true, ex.getMessage().contains("không đủ số lượng tồn kho"));
    }

    @Test
    void cancelOrderRestoresInventory() {
        SalesOrder order = SalesOrder.builder()
                .id(1001L)
                .businessId(10L)
                .orderCode("DH260821001")
                .status("CONFIRMED")
                .totalAmount(new BigDecimal("150000"))
                .note("Khách: Nguyễn Văn A")
                .build();
        SalesOrderItem item = SalesOrderItem.builder()
                .id(5001L)
                .salesOrderId(1001L)
                .productId(1L)
                .quantity(new BigDecimal("3"))
                .baseQuantity(new BigDecimal("3"))
                .unitPrice(new BigDecimal("50000"))
                .lineTotal(new BigDecimal("150000"))
                .build();

        testBalance.setQuantityOnHand(new BigDecimal("7"));

        when(salesOrderRepository.findByIdAndBusinessId(1001L, 10L)).thenReturn(Optional.of(order));
        when(salesOrderItemRepository.findAllBySalesOrderId(1001L)).thenReturn(List.of(item));
        when(inventoryBalanceRepository.findByBusinessIdAndProductId(10L, 1L)).thenReturn(Optional.of(testBalance));
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.cancelOrder("owner", 1001L);

        assertEquals("CANCELLED", response.status());

        // Verify inventory restored from 7 to 10
        ArgumentCaptor<InventoryBalance> balanceCaptor = ArgumentCaptor.forClass(InventoryBalance.class);
        verify(inventoryBalanceRepository).save(balanceCaptor.capture());
        assertEquals(new BigDecimal("10"), balanceCaptor.getValue().getQuantityOnHand());

        // Verify return transaction recorded
        ArgumentCaptor<InventoryTransaction> txCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(inventoryTransactionRepository).save(txCaptor.capture());
        assertEquals("CANCEL_SALE", txCaptor.getValue().getTransactionType());
        assertEquals(new BigDecimal("3"), txCaptor.getValue().getQuantityChange());
    }
}
