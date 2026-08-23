package com.hbdt.order.service;

import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.User;
import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.inventory.service.InventoryMovementService;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.repository.ProductRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    @Mock private CustomerRepository customerRepository;
    @Mock private DebtTransactionRepository debtTransactionRepository;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(
                salesOrderRepository, salesOrderItemRepository, productPricingService,
                businessContextService, userRepository, productRepository, unitRepository,
                inventoryMovementService, customerRepository, debtTransactionRepository
        );
    }

    @Test
    void createKeepsDifferentUnitsAndMergesOnlyExactDuplicateLines() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-001"))
                .thenReturn(false);
        when(customerRepository.findActiveForUpdate(22L, 5L))
                .thenReturn(Optional.of(Customer.builder()
                        .id(22L).businessId(5L).status("ACTIVE").build()));
        when(debtTransactionRepository.findFirstByBusinessIdAndCustomerIdOrderByIdDesc(5L, 22L))
                .thenReturn(Optional.of(DebtTransaction.builder().balanceAfter(new BigDecimal("50000")).build()));
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
                " SO-001 ", 22L, "POS", new BigDecimal("100000"), null,
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
        assertThat(response.status()).isEqualTo("CONFIRMED");
        assertThat(response.items()).hasSize(2);
        verify(inventoryMovementService, times(2)).stockOut(eq("owner"), any());
        assertThat(response.items().get(0).unitId()).isEqualTo(2L);
        assertThat(response.items().get(0).quantity()).isEqualByComparingTo("2");
        assertThat(response.items().get(0).unitPrice()).isEqualByComparingTo("15000.00");
        assertThat(response.items().get(1).unitId()).isEqualTo(3L);
        assertThat(response.items().get(1).quantity()).isEqualByComparingTo("10");
        assertThat(response.items().get(0).productPriceId()).isEqualTo(40L);
        assertThat(response.items().get(0).pricingRuleName()).isEqualTo("Giá bán");
        ArgumentCaptor<DebtTransaction> debtCaptor = ArgumentCaptor.forClass(DebtTransaction.class);
        verify(debtTransactionRepository).save(debtCaptor.capture());
        assertThat(debtCaptor.getValue().getTransactionType()).isEqualTo("DEBT_INCREASE");
        assertThat(debtCaptor.getValue().getBalanceAfter()).isEqualByComparingTo("1780000");
    }

    @Test
    void createRejectsMoreThanThreeFractionDigitsBeforeMergingLines() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                "SO-002", null, "POS", BigDecimal.ZERO, null,
                List.of(new CreateSalesOrderItemRequest(
                        10L, 2L, new BigDecimal("19.0001"), null
                ))
        );

        assertThatThrownBy(() -> service.create("owner", request))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Số lượng đặt hàng chỉ được có tối đa 3 chữ số thập phân");
    }

    @Test
    void createRejectsDebtWithoutCustomer() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(invocation -> {
                    SalesOrderItem item = invocation.getArgument(1);
                    item.setConversionRate(BigDecimal.ONE);
                    item.setBaseQuantity(item.getQuantity());
                    item.setUnitPrice(new BigDecimal("100000"));
                    item.setLineTotal(new BigDecimal("100000"));
                    return item;
                });

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                "SO-DEBT", null, "POS", BigDecimal.ZERO, null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null))
        );

        assertThatThrownBy(() -> service.create("owner", request))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Đơn hàng có công nợ bắt buộc phải chọn khách hàng");
    }

    @Test
    void paymentReducesOrderDebtAndWritesCustomerLedger() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        SalesOrderItem item = orderItem();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(
                Customer.builder().id(22L).businessId(5L).status("ACTIVE").build()));
        when(debtTransactionRepository.findFirstByBusinessIdAndCustomerIdOrderByIdDesc(5L, 22L))
                .thenReturn(Optional.of(DebtTransaction.builder().balanceAfter(new BigDecimal("250000")).build()));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(item));
        mockOrderItemDisplay();

        SalesOrderResponse response = service.makePayment("owner", 100L, new BigDecimal("50000"));

        assertThat(response.paidAmount()).isEqualByComparingTo("150000");
        assertThat(response.debtAmount()).isEqualByComparingTo("150000");
        ArgumentCaptor<DebtTransaction> captor = ArgumentCaptor.forClass(DebtTransaction.class);
        verify(debtTransactionRepository).save(captor.capture());
        assertThat(captor.getValue().getTransactionType()).isEqualTo("DEBT_PAYMENT");
        assertThat(captor.getValue().getBalanceAfter()).isEqualByComparingTo("200000");
    }

    @Test
    void cancelRestoresEveryLineAndCannotBeRepeated() {
        SalesOrder order = order(100L, "SO-004", new BigDecimal("300000"),
                new BigDecimal("300000"), BigDecimal.ZERO, null);
        SalesOrderItem item = orderItem();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(item));
        mockOrderItemDisplay();

        SalesOrderResponse response = service.cancel("owner", 100L);

        assertThat(response.status()).isEqualTo("CANCELLED");
        verify(inventoryMovementService).restoreCancelledSale(
                "owner", 10L, new BigDecimal("2.000"), 100L, "SO-004");
        assertThatThrownBy(() -> service.cancel("owner", 100L))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Đơn hàng đã được hủy trước đó");
    }

    @Test
    void employeeCancellationRequestStoresReasonWithoutRestoringInventory() {
        SalesOrder order = order(100L, "SO-005", new BigDecimal("300000"),
                new BigDecimal("300000"), BigDecimal.ZERO, null);
        SalesOrderItem item = orderItem();
        when(businessContextService.requireBusinessId("employee")).thenReturn(5L);
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(User.builder().id(8L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(item));
        mockOrderItemDisplay();

        SalesOrderResponse response = service.requestCancellation(
                "employee", 100L, "  Khách đặt nhầm sản phẩm  ");

        assertThat(response.status()).isEqualTo("CANCEL_REQUESTED");
        assertThat(response.cancelRequestedBy()).isEqualTo(8L);
        assertThat(response.cancelRequestReason()).isEqualTo("Khách đặt nhầm sản phẩm");
        assertThat(response.cancelRequestedAt()).isNotNull();
        verify(inventoryMovementService, times(0)).restoreCancelledSale(any(), any(), any(), any(), any());
    }

    private SalesOrder order(
            Long id, String code, BigDecimal total, BigDecimal paid, BigDecimal debt, Long customerId
    ) {
        return SalesOrder.builder()
                .id(id).businessId(5L).customerId(customerId).createdBy(7L)
                .orderCode(code).source("POS").status("CONFIRMED")
                .totalAmount(total).paidAmount(paid).debtAmount(debt)
                .build();
    }

    private SalesOrderItem orderItem() {
        return SalesOrderItem.builder()
                .id(101L).salesOrderId(100L).productId(10L).unitId(2L)
                .quantity(new BigDecimal("2")).conversionRate(BigDecimal.ONE)
                .baseQuantity(new BigDecimal("2.000")).unitPrice(new BigDecimal("150000"))
                .lineTotal(new BigDecimal("300000")).pricingRuleName("Giá bán")
                .build();
    }

    private void mockOrderItemDisplay() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(
                com.hbdt.entity.Product.builder().id(10L).productName("Gạo").build()));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(
                com.hbdt.entity.Unit.builder().id(2L).unitName("Kg").build()));
    }
}
