package com.hbdt.order.service;

import com.hbdt.debt.service.DebtBookkeepingService;
import com.hbdt.entity.Customer;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.User;
import com.hbdt.inventory.service.InventoryMovementService;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
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
    @Mock private RevenueLedgerService revenueLedgerService;
    @Mock private SalesBookkeepingService salesBookkeepingService;
    @Mock private DebtBookkeepingService debtBookkeepingService;

    private SalesOrderService service;

    @BeforeEach
    void setUp() {
        service = new SalesOrderService(
                salesOrderRepository, salesOrderItemRepository, productPricingService,
                businessContextService, userRepository, productRepository, unitRepository,
                inventoryMovementService, customerRepository,
                revenueLedgerService, salesBookkeepingService, debtBookkeepingService
        );
    }

    @Test
    void createKeepsDifferentUnitsAndMergesOnlyExactDuplicateLines() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-001"))
                .thenReturn(false);
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("50000")).build();
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));

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

        // ── HBDT-66: phát sinh nợ phải đi qua DebtBookkeepingService (SSOT) ──
        verify(debtBookkeepingService).recordDebtIncrease(
                any(SalesOrder.class), eq(customer), eq(7L), any(BigDecimal.class));
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
    void paymentDelegatesToDebtBookkeepingService() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        SalesOrderItem item = orderItem();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("250000")).build();
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(item));
        mockOrderItemDisplay();

        // DebtBookkeepingService sẽ cập nhật order và customer bên trong nó (mock default = no-op)
        service.makePayment("owner", 100L, new BigDecimal("50000"));

        // ── HBDT-66: thanh toán phải đi qua DebtBookkeepingService (SSOT) ────
        verify(debtBookkeepingService).recordPayment(
                eq(order), eq(customer), eq(7L),
                any(BigDecimal.class), any(), any(), any(), any());
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
        // Không có công nợ → không gọi recordDebtVoid
        verify(debtBookkeepingService, never()).recordDebtVoid(any(), any(), any(), any());

        assertThatThrownBy(() -> service.cancel("owner", 100L))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Đơn hàng đã được hủy trước đó");
    }

    @Test
    void cancelWithDebtDelegatesToDebtBookkeepingService() {
        SalesOrder order = order(100L, "SO-006", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        SalesOrderItem item = orderItem();
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("200000")).build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(item));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        mockOrderItemDisplay();

        service.cancel("owner", 100L);

        // ── HBDT-66: đảo nợ phải đi qua DebtBookkeepingService (SSOT) ─────────
        verify(debtBookkeepingService).recordDebtVoid(
                eq(order), eq(customer), eq(7L), any(String.class));
    }

    @Test
    void createWithPaidEqualsTotal_noDebtGenerated() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-PAID"))
                .thenReturn(false);
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(inv -> {
                    SalesOrderItem item = inv.getArgument(1);
                    item.setConversionRate(BigDecimal.ONE);
                    item.setBaseQuantity(item.getQuantity());
                    item.setUnitPrice(new BigDecimal("100000"));
                    item.setLineTotal(new BigDecimal("100000"));
                    item.setProductPriceId(40L);
                    item.setPricingRuleName("Giá bán");
                    return item;
                });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> {
            SalesOrder o = inv.getArgument(0);
            o.setId(101L);
            return o;
        });
        when(salesOrderItemRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        mockOrderItemDisplay();

        SalesOrderResponse response = service.create("owner", new CreateSalesOrderRequest(
                "SO-PAID", null, "POS", new BigDecimal("100000"), null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null))
        ));

        assertThat(response.paidAmount()).isEqualByComparingTo("100000");
        assertThat(response.debtAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(debtBookkeepingService, never()).recordDebtIncrease(any(), any(), any(), any());
    }

    @Test
    void createWithPaidZero_fullDebtGenerated() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-FULL-DEBT"))
                .thenReturn(false);
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(BigDecimal.ZERO).build();
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(inv -> {
                    SalesOrderItem item = inv.getArgument(1);
                    item.setConversionRate(BigDecimal.ONE);
                    item.setBaseQuantity(item.getQuantity());
                    item.setUnitPrice(new BigDecimal("150000"));
                    item.setLineTotal(new BigDecimal("150000"));
                    item.setProductPriceId(40L);
                    item.setPricingRuleName("Giá bán");
                    return item;
                });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> {
            SalesOrder o = inv.getArgument(0);
            o.setId(102L);
            return o;
        });
        when(salesOrderItemRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        mockOrderItemDisplay();

        SalesOrderResponse response = service.create("owner", new CreateSalesOrderRequest(
                "SO-FULL-DEBT", 22L, "POS", BigDecimal.ZERO, null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null))
        ));

        assertThat(response.paidAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.debtAmount()).isEqualByComparingTo("150000");
        verify(debtBookkeepingService).recordDebtIncrease(
                any(SalesOrder.class), eq(customer), eq(7L), eq(new BigDecimal("150000")));
    }

    @Test
    void createRejectsNegativePaidAmount() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(inv -> {
                    SalesOrderItem item = inv.getArgument(1);
                    item.setConversionRate(BigDecimal.ONE);
                    item.setBaseQuantity(item.getQuantity());
                    item.setUnitPrice(new BigDecimal("100000"));
                    item.setLineTotal(new BigDecimal("100000"));
                    return item;
                });

        CreateSalesOrderRequest request = new CreateSalesOrderRequest(
                "SO-NEG", 22L, "POS", new BigDecimal("-50000"), null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null))
        );

        assertThatThrownBy(() -> service.create("owner", request))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Số tiền đã trả không được nhỏ hơn 0");
    }

    @Test
    void makePaymentRejectsWhenOrderNotConfirmed() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        order.setStatus("CANCELLED");
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.makePayment("owner", 100L, new BigDecimal("50000")))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Chỉ có thể thanh toán đơn hàng đang ở trạng thái đã xác nhận (CONFIRMED)");
    }

    @Test
    void makePaymentRejectsWhenOrderAlreadyPaid() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("300000"), BigDecimal.ZERO, 22L);
        order.setPaymentStatus(com.hbdt.entity.enums.PaymentStatus.PAID);
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.makePayment("owner", 100L, new BigDecimal("50000")))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Đơn hàng đã được thanh toán đầy đủ");
    }

    @Test
    void makePaymentRejectsWhenNoCustomer() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), null);
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.makePayment("owner", 100L, new BigDecimal("50000")))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Đơn hàng không gắn với khách hàng công nợ");
    }

    @Test
    void makePaymentRejectsWhenAmountZeroOrNegative() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.makePayment("owner", 100L, BigDecimal.ZERO))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Số tiền thanh toán phải lớn hơn 0");

        assertThatThrownBy(() -> service.makePayment("owner", 100L, new BigDecimal("-10000")))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Số tiền thanh toán phải lớn hơn 0");
    }

    @Test
    void makePaymentRejectsWhenAmountExceedsDebtAmount() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.makePayment("owner", 100L, new BigDecimal("250000")))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Số tiền thanh toán không được vượt quá số còn nợ của đơn hàng");
    }

    @Test
    void makePaymentLocksOrderBeforeCustomer() {
        SalesOrder order = order(100L, "SO-003", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("250000")).build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(orderItem()));
        mockOrderItemDisplay();

        service.makePayment("owner", 100L, new BigDecimal("50000"));

        InOrder inOrder = inOrder(salesOrderRepository, customerRepository);
        inOrder.verify(salesOrderRepository).findForUpdateByIdAndBusinessId(100L, 5L);
        inOrder.verify(customerRepository).findActiveForUpdate(22L, 5L);
    }

    @Test
    void cancelLocksOrderBeforeCustomer() {
        SalesOrder order = order(100L, "SO-006", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("200000")).build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(orderItem()));
        mockOrderItemDisplay();

        service.cancel("owner", 100L);

        InOrder inOrder = inOrder(salesOrderRepository, customerRepository);
        inOrder.verify(salesOrderRepository).findForUpdateByIdAndBusinessId(100L, 5L);
        inOrder.verify(customerRepository).findActiveForUpdate(22L, 5L);
    }

    @Test
    void cancelRejectsWhenDebtVoidFailsNegativeBalance() {
        SalesOrder order = order(100L, "SO-006", new BigDecimal("300000"),
                new BigDecimal("100000"), new BigDecimal("200000"), 22L);
        Customer customer = Customer.builder()
                .id(22L).businessId(5L).status("ACTIVE").debtBalance(new BigDecimal("200000")).build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(customerRepository.findActiveForUpdate(22L, 5L)).thenReturn(Optional.of(customer));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(List.of(orderItem()));
        doThrow(new com.hbdt.common.exception.BadRequestException("Dữ liệu công nợ không nhất quán, không thể đảo nợ khi hủy đơn"))
                .when(debtBookkeepingService).recordDebtVoid(any(), any(), any(), any());

        assertThatThrownBy(() -> service.cancel("owner", 100L))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Dữ liệu công nợ không nhất quán, không thể đảo nợ khi hủy đơn");

        verify(salesOrderRepository, never()).save(any());
    }

    @Test
    void createRollbacksWhenStockOutFails() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(5L, "SO-FAIL"))
                .thenReturn(false);
        when(productPricingService.snapshotOrderItemPrice(any(), any(SalesOrderItem.class)))
                .thenAnswer(invocation -> {
                    SalesOrderItem item = invocation.getArgument(1);
                    item.setConversionRate(BigDecimal.ONE);
                    item.setBaseQuantity(item.getQuantity());
                    item.setUnitPrice(new BigDecimal("50000"));
                    item.setLineTotal(new BigDecimal("50000"));
                    return item;
                });
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(inv -> {
            SalesOrder o = inv.getArgument(0);
            o.setId(200L);
            return o;
        });
        doThrow(new com.hbdt.common.exception.BadRequestException("Sản phẩm chưa có tồn kho"))
                .when(inventoryMovementService).stockOut(any(), any());

        assertThatThrownBy(() -> service.create("owner", new CreateSalesOrderRequest(
                "SO-FAIL", null, "POS", new BigDecimal("50000"), null,
                List.of(new CreateSalesOrderItemRequest(10L, 2L, BigDecimal.ONE, null))
        )))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Sản phẩm chưa có tồn kho");

        verify(salesOrderItemRepository, never()).saveAll(any());
    }

    @Test
    void cancelRollbacksWhenRestoreFails() {
        SalesOrder order = order(100L, "SO-ERR", new BigDecimal("200000"),
                new BigDecimal("200000"), BigDecimal.ZERO, null);
        when(businessContextService.requireBusinessId("owner")).thenReturn(5L);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(salesOrderRepository.findForUpdateByIdAndBusinessId(100L, 5L)).thenReturn(Optional.of(order));
        when(salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(100L)).thenReturn(
                List.of(orderItem()));
        doThrow(new com.hbdt.common.exception.BadRequestException("Không tìm thấy giao dịch xuất kho gốc của đơn hàng"))
                .when(inventoryMovementService).restoreCancelledSale(any(), any(), any(), any(), any());

        assertThatThrownBy(() -> service.cancel("owner", 100L))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessage("Không tìm thấy giao dịch xuất kho gốc của đơn hàng");

        verify(salesOrderRepository, never()).save(any());
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

    // ── Private helpers ────────────────────────────────────────────────────────

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
