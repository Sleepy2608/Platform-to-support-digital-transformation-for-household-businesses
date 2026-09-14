package com.hbdt.accounting.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.accounting.dto.StatutoryAccountingBooksResponse;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.RevenueLedgerEntry;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import com.hbdt.repository.RevenueLedgerRepository;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.revenue.dto.BusinessOperationsReportResponse;
import com.hbdt.revenue.dto.DebtReportSummaryResponse;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import com.hbdt.revenue.dto.RevenueLedgerSummaryResponse;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountingTemplateFillServiceTest {
    @Mock BusinessContextService businessContextService;
    @Mock StatutoryAccountingService statutoryAccountingService;
    @Mock RevenueLedgerService revenueLedgerService;
    @Mock RevenueLedgerRepository revenueLedgerRepository;
    @Mock SalesOrderItemRepository salesOrderItemRepository;
    @Mock ReportTemplateRepository templateRepository;
    @Mock ReportTemplateVersionRepository versionRepository;

    private AccountingTemplateFillService service;

    @BeforeEach
    void setUp() {
        service = new AccountingTemplateFillService(businessContextService,
                statutoryAccountingService, revenueLedgerService, revenueLedgerRepository,
                salesOrderItemRepository, templateRepository, versionRepository);
    }

    @Test
    void fillsConfiguredRevenueColumnsAndWarnsForUnmappedRequiredColumn() throws Exception {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        ReportTemplate template = ReportTemplate.builder().id(10L).templateCode("S1-HKD")
                .templateName("Sổ doanh thu").templateType(TemplateType.REVENUE_LEDGER)
                .status(TemplateStatus.ACTIVE).currentVersionId(20L)
                .updatedAt(LocalDateTime.of(2026, 9, 10, 8, 0)).build();
        ReportTemplateVersion version = ReportTemplateVersion.builder().id(20L)
                .reportTemplateId(10L).versionNumber(2)
                .templateSchema(new ObjectMapper().readTree("""
                        {"columns":[
                          {"key":"invoiceNumber","label":"Số đơn","type":"text","required":true},
                          {"key":"revenue","label":"Doanh thu","type":"currency","required":true},
                          {"key":"unsupported","label":"Cột mới","type":"text","required":true}
                        ]}
                        """)).build();
        RevenueLedgerEntry entry = RevenueLedgerEntry.builder().id(1L).businessId(7L)
                .salesOrderId(2L).salesOrderItemId(3L).orderCode("DH-001")
                .confirmedAt(LocalDateTime.of(2026, 9, 14, 10, 0)).productId(4L)
                .productName("Laptop").unitId(5L).unitName("Cái")
                .quantity(BigDecimal.valueOf(2)).unitPrice(BigDecimal.valueOf(15_000_000))
                .lineTotal(BigDecimal.valueOf(30_000_000)).build();
        SalesOrderItem item = SalesOrderItem.builder().id(3L)
                .vatCalculationRate(BigDecimal.ONE).pitCalculationRate(BigDecimal.valueOf(0.5)).build();

        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(statutoryAccountingService.getBooks("owner", from, to)).thenReturn(emptyBooks(from, to));
        when(revenueLedgerService.search("owner", from, to, null, null, 0, 1))
                .thenReturn(emptyManagement(from, to));
        when(revenueLedgerRepository
                .findAllByBusinessIdAndStatusAndConfirmedAtBetweenOrderByConfirmedAtAscIdAsc(
                        eq(7L), eq("ACTIVE"), any(), any())).thenReturn(List.of(entry));
        when(salesOrderItemRepository.findAllById(List.of(3L))).thenReturn(List.of(item));
        when(templateRepository.findAllByStatusOrderByUpdatedAtDesc(TemplateStatus.ACTIVE))
                .thenReturn(List.of(template));
        when(versionRepository.findById(20L)).thenReturn(Optional.of(version));

        var reports = service.fillActiveTemplates("owner", from, to);

        assertThat(reports).hasSize(1);
        assertThat(reports.getFirst().rows().getFirst())
                .containsEntry("invoiceNumber", "DH-001")
                .containsEntry("revenue", BigDecimal.valueOf(30_000_000))
                .containsEntry("unsupported", null);
        assertThat(reports.getFirst().warnings())
                .contains("Cột 'Cột mới' chưa được nối với dữ liệu hệ thống.",
                        "Trường bắt buộc 'Cột mới' đang thiếu dữ liệu.");
    }

    private StatutoryAccountingBooksResponse emptyBooks(LocalDate from, LocalDate to) {
        return new StatutoryAccountingBooksResponse(from, to, "TT88", "snapshot", "average",
                List.of(), BigDecimal.ZERO, List.of(), List.of(), BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, "DRAFT", null, null, null, "signature");
    }

    private RevenueLedgerPageResponse emptyManagement(LocalDate from, LocalDate to) {
        BigDecimal zero = BigDecimal.ZERO;
        return new RevenueLedgerPageResponse(List.of(), List.of(), List.of(),
                new DebtReportSummaryResponse(zero, zero, zero, zero, zero, 0),
                new BusinessOperationsReportResponse(from, to, zero, zero, zero, zero, zero,
                        zero, zero, 0L, 0L, "MANAGEMENT", "DRAFT", null, null, null, "signature"),
                "TT88", new RevenueLedgerSummaryResponse(zero, zero, zero, zero, zero, zero,
                zero, 0L, 0L), 0, 1, 0, 0, true, true);
    }
}
