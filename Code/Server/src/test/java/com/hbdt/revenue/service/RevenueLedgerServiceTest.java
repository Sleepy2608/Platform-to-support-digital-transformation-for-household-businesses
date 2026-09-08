package com.hbdt.revenue.service;

import com.hbdt.entity.*;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.*;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RevenueLedgerServiceTest {

    @Mock private RevenueLedgerRepository revenueLedgerRepository;
    @Mock private BusinessContextService businessContextService;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;

    private RevenueLedgerService service;

    @BeforeEach
    void setUp() {
        service = new RevenueLedgerService(
                revenueLedgerRepository,
                businessContextService,
                customerRepository,
                productRepository,
                unitRepository
        );
    }

    @Test
    void recordRevenueForOrder_MultipleItems_Success() {
        SalesOrder order = SalesOrder.builder()
                .id(100L)
                .businessId(1L)
                .orderCode("SO-TEST-001")
                .customerId(10L)
                .totalAmount(new BigDecimal("150000"))
                .status("CONFIRMED")
                .confirmedAt(LocalDateTime.now())
                .build();

        SalesOrderItem item1 = SalesOrderItem.builder()
                .id(1L)
                .salesOrderId(100L)
                .productId(201L)
                .unitId(301L)
                .quantity(new BigDecimal("2.000"))
                .unitPrice(new BigDecimal("50000.00"))
                .lineTotal(new BigDecimal("100000.00"))
                .build();

        SalesOrderItem item2 = SalesOrderItem.builder()
                .id(2L)
                .salesOrderId(100L)
                .productId(202L)
                .unitId(302L)
                .quantity(new BigDecimal("1.000"))
                .unitPrice(new BigDecimal("50000.00"))
                .lineTotal(new BigDecimal("50000.00"))
                .build();

        when(revenueLedgerRepository.existsByBusinessIdAndSalesOrderIdAndStatus(1L, 100L, "ACTIVE"))
                .thenReturn(false);
        when(customerRepository.findById(10L)).thenReturn(Optional.of(Customer.builder().id(10L).customerName("Nguyễn Văn A").build()));
        when(productRepository.findById(201L)).thenReturn(Optional.of(Product.builder().id(201L).productName("Gạo ST25").build()));
        when(productRepository.findById(202L)).thenReturn(Optional.of(Product.builder().id(202L).productName("Nước mắm").build()));
        when(unitRepository.findById(301L)).thenReturn(Optional.of(Unit.builder().id(301L).unitName("Bao").build()));
        when(unitRepository.findById(302L)).thenReturn(Optional.of(Unit.builder().id(302L).unitName("Chai").build()));

        service.recordRevenueForOrder(order, List.of(item1, item2));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RevenueLedgerEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(revenueLedgerRepository).saveAll(captor.capture());

        List<RevenueLedgerEntry> saved = captor.getValue();
        assertThat(saved).hasSize(2);

        RevenueLedgerEntry entry1 = saved.get(0);
        assertThat(entry1.getOrderCode()).isEqualTo("SO-TEST-001");
        assertThat(entry1.getCustomerName()).isEqualTo("Nguyễn Văn A");
        assertThat(entry1.getProductName()).isEqualTo("Gạo ST25");
        assertThat(entry1.getUnitName()).isEqualTo("Bao");
        assertThat(entry1.getQuantity()).isEqualByComparingTo("2.000");
        assertThat(entry1.getLineTotal()).isEqualByComparingTo("100000.00");
        assertThat(entry1.getOrderTotalAmount()).isEqualByComparingTo("150000");
        assertThat(entry1.getStatus()).isEqualTo("ACTIVE");

        RevenueLedgerEntry entry2 = saved.get(1);
        assertThat(entry2.getProductName()).isEqualTo("Nước mắm");
        assertThat(entry2.getLineTotal()).isEqualByComparingTo("50000.00");
    }

    @Test
    void recordRevenueForOrder_AvoidsDuplicates() {
        SalesOrder order = SalesOrder.builder()
                .id(100L)
                .businessId(1L)
                .orderCode("SO-TEST-001")
                .status("CONFIRMED")
                .build();
        SalesOrderItem item = SalesOrderItem.builder().id(1L).build();

        when(revenueLedgerRepository.existsByBusinessIdAndSalesOrderIdAndStatus(1L, 100L, "ACTIVE"))
                .thenReturn(true);

        service.recordRevenueForOrder(order, List.of(item));

        verify(revenueLedgerRepository, never()).saveAll(any());
    }

    @Test
    void voidRevenueForOrder_Success() {
        service.voidRevenueForOrder(1L, 100L);
        verify(revenueLedgerRepository).updateStatusBySalesOrderId(eq(100L), eq("CANCELLED"), any(LocalDateTime.class));
    }

    @Test
    void search_ReturnsFilteredLedgerAndSummary() {
        when(businessContextService.requireBusinessId("testuser")).thenReturn(1L);

        RevenueLedgerEntry entry = RevenueLedgerEntry.builder()
                .id(1L)
                .salesOrderId(100L)
                .salesOrderItemId(1L)
                .orderCode("SO-001")
                .confirmedAt(LocalDateTime.now())
                .customerName("Khách lẻ")
                .productName("Sản phẩm 1")
                .unitName("Cái")
                .quantity(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("20000.00"))
                .lineTotal(new BigDecimal("100000.00"))
                .orderTotalAmount(new BigDecimal("100000.00"))
                .status("ACTIVE")
                .build();

        Page<RevenueLedgerEntry> page = new PageImpl<>(List.of(entry));
        when(revenueLedgerRepository.searchLedger(eq(1L), eq("ACTIVE"), any(), any(), isNull(), eq("SO-001"), any(Pageable.class)))
                .thenReturn(page);

        RevenueLedgerRepository.RevenueSummaryProjection summaryProj = mock(RevenueLedgerRepository.RevenueSummaryProjection.class);
        when(summaryProj.getTotalRevenue()).thenReturn(new BigDecimal("100000.00"));
        when(summaryProj.getTotalQuantity()).thenReturn(new BigDecimal("5.000"));
        when(summaryProj.getTotalOrders()).thenReturn(1L);
        when(summaryProj.getTotalItems()).thenReturn(1L);

        when(revenueLedgerRepository.calculateSummary(eq(1L), eq("ACTIVE"), any(), any(), isNull(), eq("SO-001")))
                .thenReturn(summaryProj);

        RevenueLedgerPageResponse response = service.search(
                "testuser",
                LocalDate.now(),
                LocalDate.now(),
                "SO-001",
                null,
                0,
                15
        );

        assertThat(response.items()).hasSize(1);
        assertThat(response.summary().totalRevenue()).isEqualByComparingTo("100000.00");
        assertThat(response.summary().totalOrders()).isEqualTo(1L);
    }
}
