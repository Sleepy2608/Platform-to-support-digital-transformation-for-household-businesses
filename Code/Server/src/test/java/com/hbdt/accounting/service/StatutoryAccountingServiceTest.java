package com.hbdt.accounting.service;

import com.hbdt.accounting.dto.StatutoryAccountingBooksResponse;
import com.hbdt.entity.*;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.common.service.AuditLogService;
import com.hbdt.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class StatutoryAccountingServiceTest {

    @Test
    void buildsS1S2AndS4FromConfirmedSourceEvents() {
        BusinessContextService context = mock(BusinessContextService.class);
        RevenueLedgerRepository revenue = mock(RevenueLedgerRepository.class);
        SalesOrderItemRepository orderItems = mock(SalesOrderItemRepository.class);
        TaxActivityGroupRepository taxGroups = mock(TaxActivityGroupRepository.class);
        InventoryTransactionRepository inventory = mock(InventoryTransactionRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        UnitRepository units = mock(UnitRepository.class);
        AccountingReportReviewRepository reviews = mock(AccountingReportReviewRepository.class);
        UserRepository users = mock(UserRepository.class);
        TaxTypeRepository taxTypes = mock(TaxTypeRepository.class);
        TaxObligationRepository obligations = mock(TaxObligationRepository.class);
        TaxPaymentRepository taxPayments = mock(TaxPaymentRepository.class);
        AuditLogService audit = mock(AuditLogService.class);
        StatutoryAccountingService service = new StatutoryAccountingService(context, revenue,
                orderItems, taxGroups, inventory, products, units, reviews, users,
                taxTypes, obligations, taxPayments, audit);

        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        when(context.requireBusinessId("owner")).thenReturn(5L);
        when(revenue.findAllByBusinessIdAndStatusAndConfirmedAtBetweenOrderByConfirmedAtAscIdAsc(
                eq(5L), eq("ACTIVE"), any(), any())).thenReturn(List.of(
                RevenueLedgerEntry.builder().id(1L).salesOrderItemId(10L)
                        .lineTotal(new BigDecimal("100000")).build()));
        when(orderItems.findAllById(any())).thenReturn(List.of(
                SalesOrderItem.builder().id(10L).taxActivityGroupId(1L)
                        .vatCalculationRate(new BigDecimal("1.0"))
                        .pitCalculationRate(new BigDecimal("0.5")).build()));
        when(taxGroups.findAllById(any())).thenReturn(List.of(
                TaxActivityGroup.builder().id(1L).activityCode("DISTRIBUTION_GOODS")
                        .activityName("Phân phối hàng hóa").build()));
        when(inventory.findAllByBusinessIdAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(eq(5L), any()))
                .thenReturn(List.of(
                        InventoryTransaction.builder().productId(20L)
                                .createdAt(LocalDateTime.of(2026, 9, 5, 10, 0))
                                .transactionType("STOCK_IN")
                                .quantityChange(new BigDecimal("5")).transactionValue(new BigDecimal("300000"))
                                .balanceAfter(new BigDecimal("15")).balanceValue(new BigDecimal("800000")).build(),
                        InventoryTransaction.builder().productId(20L)
                                .createdAt(LocalDateTime.of(2026, 9, 8, 10, 0))
                                .transactionType("STOCK_OUT")
                                .quantityChange(new BigDecimal("-3")).transactionValue(new BigDecimal("160000"))
                                .balanceAfter(new BigDecimal("12")).balanceValue(new BigDecimal("640000")).build(),
                        InventoryTransaction.builder().productId(20L)
                                .createdAt(LocalDateTime.of(2026, 9, 9, 10, 0))
                                .transactionType("CANCEL_SALE")
                                .quantityChange(new BigDecimal("1")).transactionValue(new BigDecimal("53333"))
                                .balanceAfter(new BigDecimal("13")).balanceValue(new BigDecimal("693333")).build()));
        when(products.findAllById(any())).thenReturn(List.of(Product.builder().id(20L)
                .productCode("SP20").productName("Xi măng").baseUnitId(2L).build()));
        when(units.findAllById(any())).thenReturn(List.of(Unit.builder().id(2L).unitName("Bao").build()));
        when(reviews.findFirstByBusinessIdAndPeriodFromAndPeriodToAndDataSignatureOrderByReviewedAtDescIdDesc(
                eq(5L), eq(from), eq(to), any())).thenReturn(Optional.empty());
        TaxType vatType = TaxType.builder().id(100L).taxCode("VAT").taxName("GTGT").status("ACTIVE").build();
        TaxType pitType = TaxType.builder().id(101L).taxCode("PIT").taxName("TNCN").status("ACTIVE").build();
        when(taxTypes.findFirstByTaxCodeIgnoreCase("VAT")).thenReturn(Optional.of(vatType));
        when(taxTypes.findFirstByTaxCodeIgnoreCase("PIT")).thenReturn(Optional.of(pitType));
        when(obligations.findByBusinessIdAndObligationCode(eq(5L), any())).thenReturn(Optional.empty());
        when(obligations.save(any())).thenAnswer(invocation -> {
            TaxObligation value = invocation.getArgument(0);
            value.setId("VAT".equals(value.getObligationCode().substring(0, 3)) ? 200L : 201L);
            return value;
        });
        when(taxPayments.sumPaidByObligationId(any())).thenReturn(BigDecimal.ZERO);

        StatutoryAccountingBooksResponse result = service.getBooks("owner", from, to);

        assertThat(result.s1TotalRevenue()).isEqualByComparingTo("100000.00");
        assertThat(result.s1RevenueByTaxGroup().getFirst().vatPayable()).isEqualByComparingTo("1000.00");
        assertThat(result.s1RevenueByTaxGroup().getFirst().pitPayable()).isEqualByComparingTo("500.00");
        assertThat(result.s4TotalPayable()).isEqualByComparingTo("1500.00");
        assertThat(result.s2Inventory().getFirst().openingQuantity()).isEqualByComparingTo("10.000");
        assertThat(result.s2Inventory().getFirst().openingValue()).isEqualByComparingTo("500000.00");
        assertThat(result.s2Inventory().getFirst().stockInQuantity()).isEqualByComparingTo("5.000");
        assertThat(result.s2Inventory().getFirst().returnedQuantity()).isEqualByComparingTo("1.000");
        assertThat(result.s2Inventory().getFirst().stockOutQuantity()).isEqualByComparingTo("3.000");
        assertThat(result.s2Inventory().getFirst().closingQuantity()).isEqualByComparingTo("13.000");
        assertThat(result.s2Inventory().getFirst().closingValue()).isEqualByComparingTo("693333.00");
        assertThat(result.s2Inventory().getFirst().costComplete()).isTrue();
        assertThat(result.reviewStatus()).isEqualTo("DRAFT");
    }
}
