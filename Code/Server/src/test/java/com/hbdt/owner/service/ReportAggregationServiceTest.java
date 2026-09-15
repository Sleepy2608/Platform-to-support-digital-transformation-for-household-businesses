package com.hbdt.owner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.*;
import com.hbdt.order.event.SalesBookkeepingEvent;
import com.hbdt.owner.dto.ReportReviewResponse;
import com.hbdt.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportAggregationServiceTest {

    @Mock private GeneratedReportRepository reportRepository;
    @Mock private ReportTemplateRepository templateRepository;
    @Mock private ReportTemplateVersionRepository versionRepository;
    @Mock private AccountingTransactionRepository accountingTransactionRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReportReviewService reportReviewService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ReportAggregationService service;

    private static final Long BUSINESS_ID = 100L;
    private static final Long OWNER_USER_ID = 10L;
    private static final String OWNER_USERNAME = "owner_test";

    @BeforeEach
    void setUp() {
        service = new ReportAggregationService(
                reportRepository,
                templateRepository,
                versionRepository,
                accountingTransactionRepository,
                customerRepository,
                userRepository,
                reportReviewService,
                objectMapper
        );
    }

    private User createOwner() {
        Role role = new Role();
        role.setId(2L);
        role.setName(RoleType.BUSINESS_OWNER);

        return User.builder()
                .id(OWNER_USER_ID)
                .username(OWNER_USERNAME)
                .fullName("Chủ Hộ Kinh Doanh")
                .businessId(BUSINESS_ID)
                .role(role)
                .build();
    }

    private ReportTemplate createTemplate() {
        return ReportTemplate.builder()
                .id(1L)
                .templateCode("RL-2026-001")
                .templateName("Sổ chi tiết doanh thu bán hàng")
                .templateType(TemplateType.REVENUE_LEDGER)
                .status(TemplateStatus.ACTIVE)
                .currentVersionId(10L)
                .build();
    }

    @Test
    @DisplayName("Should aggregate transactions into a new report with PENDING_REVIEW status")
    void generateReportForOwner_aggregatesTransactionsSuccessfully() {
        User owner = createOwner();
        ReportTemplate template = createTemplate();

        AccountingTransaction tx1 = AccountingTransaction.builder()
                .id(1L)
                .businessId(BUSINESS_ID)
                .orderId(201L)
                .customerId(50L)
                .transactionType(AccountingTransactionType.SALE)
                .totalAmount(new BigDecimal("500000"))
                .paidAmount(new BigDecimal("500000"))
                .debtAmount(BigDecimal.ZERO)
                .paymentMethod(PaymentMethod.CASH)
                .status(AccountingTransactionStatus.COMPLETED)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByUsername(OWNER_USERNAME)).thenReturn(Optional.of(owner));
        when(templateRepository.findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE))
                .thenReturn(Optional.of(template));
        when(accountingTransactionRepository.findAllByBusinessIdAndStatusAndCreatedAtBetween(
                eq(BUSINESS_ID), eq(AccountingTransactionStatus.COMPLETED), any(), any()))
                .thenReturn(List.of(tx1));
        when(customerRepository.findById(50L))
                .thenReturn(Optional.of(Customer.builder().id(50L).customerName("Nguyễn Văn A").build()));
        when(reportRepository.findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
                any(), any(), any(), any(), any()))
                .thenReturn(Optional.empty());
        when(reportRepository.findMaxGenerationNo(any(), any(), any(), any())).thenReturn(0);
        when(reportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> {
            GeneratedReport r = inv.getArgument(0);
            r.setId(99L);
            return r;
        });
        when(reportReviewService.toResponse(any())).thenAnswer(inv -> {
            GeneratedReport r = inv.getArgument(0);
            return ReportReviewResponse.builder()
                    .id(r.getId())
                    .status(r.getStatus())
                    .reportData(r.getReportData())
                    .build();
        });

        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);

        ReportReviewResponse response = service.generateReportForOwner(OWNER_USERNAME, from, to);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ReportStatus.PENDING_REVIEW);

        ArgumentCaptor<GeneratedReport> captor = ArgumentCaptor.forClass(GeneratedReport.class);
        verify(reportRepository).save(captor.capture());
        GeneratedReport saved = captor.getValue();
        assertThat(saved.getGenerationMethod()).isEqualTo("AUTOMATIC");
        assertThat(saved.getGenerationNo()).isEqualTo(1);
        assertThat(saved.getReportData().isArray()).isTrue();
        assertThat(saved.getReportData().get(0).get("Doanh thu bán hàng").asLong()).isEqualTo(500000L);
    }

    @Test
    @DisplayName("Should throw BadRequestException when no transactions exist in period")
    void generateReportForOwner_whenNoTransactions_throwsBadRequestException() {
        User owner = createOwner();
        ReportTemplate template = createTemplate();

        when(userRepository.findByUsername(OWNER_USERNAME)).thenReturn(Optional.of(owner));
        when(templateRepository.findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE))
                .thenReturn(Optional.of(template));
        when(accountingTransactionRepository.findAllByBusinessIdAndStatusAndCreatedAtBetween(
                eq(BUSINESS_ID), eq(AccountingTransactionStatus.COMPLETED), any(), any()))
                .thenReturn(List.of());
        when(reportRepository.findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
                any(), any(), any(), any(), any()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.generateReportForOwner(OWNER_USERNAME, null, null))
                .isInstanceOf(com.hbdt.common.exception.BadRequestException.class)
                .hasMessageContaining("Chưa có phát sinh bút toán bán hàng nào");
    }

    @Test
    @DisplayName("Should update existing PENDING_REVIEW report instead of creating duplicate")
    void generateReportForOwner_updatesExistingPendingReviewReport() {
        User owner = createOwner();
        ReportTemplate template = createTemplate();

        GeneratedReport existing = GeneratedReport.builder()
                .id(42L)
                .businessId(BUSINESS_ID)
                .templateVersionId(10L)
                .status(ReportStatus.PENDING_REVIEW)
                .generationNo(1)
                .build();

        when(userRepository.findByUsername(OWNER_USERNAME)).thenReturn(Optional.of(owner));
        when(templateRepository.findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE))
                .thenReturn(Optional.of(template));
        when(accountingTransactionRepository.findAllByBusinessIdAndStatusAndCreatedAtBetween(
                eq(BUSINESS_ID), eq(AccountingTransactionStatus.COMPLETED), any(), any()))
                .thenReturn(List.of());
        when(reportRepository.findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
                any(), any(), any(), any(), any()))
                .thenReturn(Optional.of(existing));
        when(reportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reportReviewService.toResponse(any())).thenAnswer(inv -> ReportReviewResponse.builder().id(42L).build());

        ReportReviewResponse response = service.generateReportForOwner(OWNER_USERNAME, null, null);

        assertThat(response.getId()).isEqualTo(42L);
        verify(reportRepository).save(existing);
        verify(reportRepository, never()).findMaxGenerationNo(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should automatically trigger report aggregation via SalesBookkeepingEvent")
    void onSalesBookkept_listenerTriggersAggregation() {
        ReportTemplate template = createTemplate();
        when(templateRepository.findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE))
                .thenReturn(Optional.of(template));
        when(accountingTransactionRepository.findAllByBusinessIdAndStatusAndCreatedAtBetween(
                eq(BUSINESS_ID), eq(AccountingTransactionStatus.COMPLETED), any(), any()))
                .thenReturn(List.of());
        when(reportRepository.save(any(GeneratedReport.class))).thenAnswer(inv -> inv.getArgument(0));

        SalesBookkeepingEvent event = new SalesBookkeepingEvent(BUSINESS_ID, 501L);
        service.onSalesBookkept(event);

        verify(reportRepository).save(any(GeneratedReport.class));
    }
}
