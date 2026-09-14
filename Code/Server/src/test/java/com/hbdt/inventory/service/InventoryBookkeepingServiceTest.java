package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.AddressFormatterService;
import com.hbdt.entity.BusinessProfile;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.Unit;
import com.hbdt.inventory.dto.InventoryBookkeepingSummaryResponse;
import com.hbdt.inventory.dto.InventoryLedgerEntryResponse;
import com.hbdt.inventory.dto.InventoryLedgerResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.BusinessProfileRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryBookkeepingServiceTest {

    @Mock private BusinessContextService businessContextService;
    @Mock private BusinessProfileRepository businessProfileRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private InventoryTransactionRepository transactionRepository;
    @Mock private StockImportRepository stockImportRepository;
    @Mock private SalesOrderRepository salesOrderRepository;
    @Mock private AddressFormatterService addressFormatterService;

    private InventoryBookkeepingService service;

    private BusinessProfile mockBusiness;
    private Product mockProduct;
    private Unit mockUnit;

    @BeforeEach
    void setUp() {
        service = new InventoryBookkeepingService(
                businessContextService,
                businessProfileRepository,
                productRepository,
                unitRepository,
                transactionRepository,
                stockImportRepository,
                salesOrderRepository,
                addressFormatterService
        );

        mockBusiness = BusinessProfile.builder()
                .id(1L)
                .businessCode("HKD-001")
                .businessName("Tiệm Tạp Hóa An Nhiên")
                .ownerName("Nguyễn Văn An")
                .taxCode("0123456789")
                .address("123 Phố Huế, Hà Nội")
                .build();

        mockProduct = Product.builder()
                .id(10L)
                .businessId(1L)
                .productCode("SP-01")
                .productName("Sữa hạt dinh dưỡng")
                .baseUnitId(2L)
                .build();

        mockUnit = Unit.builder()
                .id(2L)
                .unitCode("HOP")
                .unitName("Hộp")
                .status("ACTIVE")
                .build();

        // Default stub: trả lại nguyên chuỗi input để không phá vỡ các test khác
        lenient().when(addressFormatterService.formatAddress(any()))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void getLedger_WithOpeningBalanceAndTransactions_CalculatesAccurately() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findByIdAndBusinessId(10L, 1L)).thenReturn(Optional.of(mockProduct));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(mockUnit));

        LocalDateTime periodStart = LocalDateTime.of(2026, 9, 1, 0, 0, 0);
        LocalDateTime periodEnd = LocalDateTime.of(2026, 9, 30, 23, 59, 59);

        // Số dư đầu kỳ: Giao dịch cuối trước 2026-09-01
        InventoryTransaction openingTx = InventoryTransaction.builder()
                .id(1L)
                .businessId(1L)
                .productId(10L)
                .balanceAfter(new BigDecimal("50.000"))
                .balanceValue(new BigDecimal("1000000.00"))
                .unitCost(new BigDecimal("20000.00"))
                .createdAt(LocalDateTime.of(2026, 8, 25, 10, 0, 0))
                .build();

        when(transactionRepository.findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                eq(1L), eq(10L), any(LocalDateTime.class)
        )).thenReturn(Optional.of(openingTx));

        // Các giao dịch trong kỳ:
        // 1. STOCK_IN (+20 hộp @ 22,000 = 440,000 -> tồn 70)
        InventoryTransaction tx1 = InventoryTransaction.builder()
                .id(10L)
                .businessId(1L)
                .productId(10L)
                .transactionType("STOCK_IN")
                .referenceType("STOCK_IMPORT")
                .referenceId(101L)
                .quantityChange(new BigDecimal("20.000"))
                .balanceAfter(new BigDecimal("70.000"))
                .unitCost(new BigDecimal("22000.00"))
                .transactionValue(new BigDecimal("440000.00"))
                .balanceValue(new BigDecimal("1440000.00"))
                .costStatus("COSTED")
                .createdAt(LocalDateTime.of(2026, 9, 5, 8, 0, 0))
                .build();

        // 2. STOCK_OUT (-15 hộp @ 20,571.43 = 308,571.45 -> tồn 55)
        InventoryTransaction tx2 = InventoryTransaction.builder()
                .id(11L)
                .businessId(1L)
                .productId(10L)
                .transactionType("STOCK_OUT")
                .referenceType("SALES_ORDER")
                .referenceId(201L)
                .quantityChange(new BigDecimal("-15.000"))
                .balanceAfter(new BigDecimal("55.000"))
                .unitCost(new BigDecimal("20571.43"))
                .transactionValue(new BigDecimal("308571.45"))
                .balanceValue(new BigDecimal("1131428.55"))
                .costStatus("COSTED")
                .createdAt(LocalDateTime.of(2026, 9, 10, 14, 0, 0))
                .build();

        // 3. ADJUSTMENT tăng (+5 hộp do kiểm kê thừa = 100,000 -> tồn 60)
        InventoryTransaction tx3 = InventoryTransaction.builder()
                .id(12L)
                .businessId(1L)
                .productId(10L)
                .transactionType("ADJUSTMENT")
                .referenceType("STOCK_ADJUSTMENT")
                .quantityChange(new BigDecimal("5.000"))
                .balanceAfter(new BigDecimal("60.000"))
                .unitCost(new BigDecimal("20000.00"))
                .transactionValue(new BigDecimal("100000.00"))
                .balanceValue(new BigDecimal("1231428.55"))
                .costStatus("COMPLETED")
                .note("[Kiểm kê] Thừa hàng thực tế")
                .createdAt(LocalDateTime.of(2026, 9, 20, 16, 0, 0))
                .build();

        when(transactionRepository.findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                eq(1L), eq(10L), any(LocalDateTime.class), any(LocalDateTime.class)
        )).thenReturn(List.of(tx1, tx2, tx3));

        // Mock vouchers
        StockImport mockImport = StockImport.builder().id(101L).importCode("NK-20260905-001").importDate(LocalDateTime.of(2026, 9, 5, 8, 0, 0)).build();
        SalesOrder mockOrder = SalesOrder.builder().id(201L).orderCode("HD-20260910-001").createdAt(LocalDateTime.of(2026, 9, 10, 14, 0, 0)).build();

        when(stockImportRepository.findAllById(List.of(101L))).thenReturn(List.of(mockImport));
        when(salesOrderRepository.findAllById(List.of(201L))).thenReturn(List.of(mockOrder));

        InventoryLedgerResponse ledger = service.getLedger("owner", 10L, "2026-09-01", "2026-09-30");

        // Kiểm tra thông tin chung
        assertThat(ledger.businessName()).isEqualTo("Tiệm Tạp Hóa An Nhiên");
        assertThat(ledger.ownerName()).isEqualTo("Nguyễn Văn An");
        assertThat(ledger.taxCode()).isEqualTo("0123456789");
        assertThat(ledger.productCode()).isEqualTo("SP-01");
        assertThat(ledger.productName()).isEqualTo("Sữa hạt dinh dưỡng");
        assertThat(ledger.unitName()).isEqualTo("Hộp");

        // Kiểm tra số dư đầu kỳ (50 hộp, 1,000,000đ, đơn giá 20,000)
        assertThat(ledger.openingQuantity()).isEqualByComparingTo("50.000");
        assertThat(ledger.openingAmount()).isEqualByComparingTo("1000000.00");
        assertThat(ledger.openingUnitCost()).isEqualByComparingTo("20000.00");

        // Kiểm tra các dòng phát sinh
        assertThat(ledger.entries()).hasSize(3);
        InventoryLedgerEntryResponse entry1 = ledger.entries().get(0);
        assertThat(entry1.voucherNo()).isEqualTo("NK-20260905-001");
        assertThat(entry1.importQuantity()).isEqualByComparingTo("20.000");
        assertThat(entry1.importAmount()).isEqualByComparingTo("440000.00");
        assertThat(entry1.exportQuantity()).isEqualByComparingTo("0.000");

        InventoryLedgerEntryResponse entry2 = ledger.entries().get(1);
        assertThat(entry2.voucherNo()).isEqualTo("HD-20260910-001");
        assertThat(entry2.importQuantity()).isEqualByComparingTo("0.000");
        assertThat(entry2.exportQuantity()).isEqualByComparingTo("15.000");
        assertThat(entry2.exportAmount()).isEqualByComparingTo("308571.45");

        InventoryLedgerEntryResponse entry3 = ledger.entries().get(2);
        assertThat(entry3.voucherNo()).isEqualTo("DC-12");
        assertThat(entry3.importQuantity()).isEqualByComparingTo("5.000");
        assertThat(entry3.exportQuantity()).isEqualByComparingTo("0.000");

        // Tổng phát sinh:
        // Nhập = 20 + 5 = 25 hộp, tiền nhập = 440,000 + 100,000 = 540,000
        // Xuất = 15 hộp, tiền xuất = 308,571.45
        assertThat(ledger.totalImportQuantity()).isEqualByComparingTo("25.000");
        assertThat(ledger.totalImportAmount()).isEqualByComparingTo("540000.00");
        assertThat(ledger.totalExportQuantity()).isEqualByComparingTo("15.000");
        assertThat(ledger.totalExportAmount()).isEqualByComparingTo("308571.45");

        // Số dư cuối kỳ:
        // Tồn cuối = 50 + 25 - 15 = 60 hộp
        // Tiền cuối = 1,000,000 + 540,000 - 308,571.45 = 1,231,428.55
        assertThat(ledger.closingQuantity()).isEqualByComparingTo("60.000");
        assertThat(ledger.closingAmount()).isEqualByComparingTo("1231428.55");
    }

    @Test
    void getLedger_NoPreviousTransactions_OpeningBalanceIsZero() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findByIdAndBusinessId(10L, 1L)).thenReturn(Optional.of(mockProduct));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(mockUnit));

        when(transactionRepository.findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                eq(1L), eq(10L), any(LocalDateTime.class)
        )).thenReturn(Optional.empty());

        when(transactionRepository.findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                eq(1L), eq(10L), any(LocalDateTime.class), any(LocalDateTime.class)
        )).thenReturn(List.of());

        InventoryLedgerResponse ledger = service.getLedger("owner", 10L, "2026-09-01", "2026-09-30");

        assertThat(ledger.openingQuantity()).isEqualByComparingTo("0.000");
        assertThat(ledger.openingAmount()).isEqualByComparingTo("0.00");
        assertThat(ledger.openingUnitCost()).isEqualByComparingTo("0.00");
        assertThat(ledger.closingQuantity()).isEqualByComparingTo("0.000");
        assertThat(ledger.closingAmount()).isEqualByComparingTo("0.00");
        assertThat(ledger.entries()).isEmpty();
    }

    @Test
    void getLedger_ProductNotFound_ThrowsResourceNotFoundException() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findByIdAndBusinessId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getLedger("owner", 999L, "2026-09-01", "2026-09-30"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy sản phẩm #999");
    }

    @Test
    void getLedger_NullProductId_ThrowsBadRequestException() {
        assertThatThrownBy(() -> service.getLedger("owner", null, "2026-09-01", "2026-09-30"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn sản phẩm để xem sổ S2-HKD");
    }

    @Test
    void getLedger_InvalidDateRange_ThrowsBadRequestException() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findByIdAndBusinessId(10L, 1L)).thenReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> service.getLedger("owner", 10L, "2026-09-30", "2026-09-01"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời gian bắt đầu không được lớn hơn thời gian kết thúc");
    }

    @Test
    void getSummary_AggregatesAllProductsOrSpecificProduct() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findAllByBusinessIdOrderByProductNameAsc(1L)).thenReturn(List.of(mockProduct));
        when(unitRepository.findAllById(List.of(2L))).thenReturn(List.of(mockUnit));

        when(transactionRepository.findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                eq(1L), eq(10L), any(LocalDateTime.class)
        )).thenReturn(Optional.empty());

        InventoryTransaction tx = InventoryTransaction.builder()
                .id(10L)
                .businessId(1L)
                .productId(10L)
                .transactionType("STOCK_IN")
                .quantityChange(new BigDecimal("10.000"))
                .transactionValue(new BigDecimal("200000.00"))
                .balanceAfter(new BigDecimal("10.000"))
                .balanceValue(new BigDecimal("200000.00"))
                .createdAt(LocalDateTime.of(2026, 9, 10, 10, 0, 0))
                .build();

        when(transactionRepository.findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                eq(1L), eq(10L), any(LocalDateTime.class), any(LocalDateTime.class)
        )).thenReturn(List.of(tx));

        InventoryBookkeepingSummaryResponse summary = service.getSummary("owner", null, "2026-09-01", "2026-09-30");

        assertThat(summary.businessName()).isEqualTo("Tiệm Tạp Hóa An Nhiên");
        assertThat(summary.totalTransactions()).isEqualTo(1L);
        assertThat(summary.totalImportQuantity()).isEqualByComparingTo("10.000");
        assertThat(summary.totalImportAmount()).isEqualByComparingTo("200000.00");
        assertThat(summary.totalExportQuantity()).isEqualByComparingTo("0.000");
        assertThat(summary.productSummaries()).hasSize(1);

        assertThat(summary.productSummaries().get(0).productName()).isEqualTo("Sữa hạt dinh dưỡng");
        assertThat(summary.productSummaries().get(0).closingQuantity()).isEqualByComparingTo("10.000");
    }

    // -----------------------------------------------------------------------
    // Address formatting tests
    // -----------------------------------------------------------------------

    @Test
    void getLedger_JsonAddress_UsesAddressFormatterService() {
        // Arrange: business có địa chỉ JSON hợp lệ
        String jsonAddress = "{\"detailAddress\":\"12 Trần Hưng Đạo\",\"wardCode\":\"00001\",\"districtCode\":\"001\",\"provinceCode\":\"01\"}";
        mockBusiness = BusinessProfile.builder()
                .id(1L)
                .businessCode("HKD-001")
                .businessName("Tiệm Tạp Hóa An Nhiên")
                .ownerName("Nguyễn Văn An")
                .taxCode("0123456789")
                .address(jsonAddress)
                .build();

        String expectedFormatted = "12 Trần Hưng Đạo, Phường Hàng Bài, Quận Hoàn Kiếm, Thành phố Hà Nội";
        when(addressFormatterService.formatAddress(jsonAddress)).thenReturn(expectedFormatted);

        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));
        when(productRepository.findByIdAndBusinessId(10L, 1L)).thenReturn(Optional.of(mockProduct));
        when(unitRepository.findById(2L)).thenReturn(Optional.of(mockUnit));

        LocalDateTime periodStart = LocalDateTime.of(2026, 9, 1, 0, 0, 0);
        LocalDateTime periodEnd   = LocalDateTime.of(2026, 9, 30, 23, 59, 59);

        when(transactionRepository.findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                eq(1L), eq(10L), any(LocalDateTime.class)
        )).thenReturn(Optional.empty());

        when(transactionRepository.findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                eq(1L), eq(10L), any(LocalDateTime.class), any(LocalDateTime.class)
        )).thenReturn(List.of());

        // Act
        InventoryLedgerResponse ledger = service.getLedger("owner", 10L, "2026-09-01", "2026-09-30");

        // Assert: businessAddress phải là chuỗi đã format, không phải JSON thô
        assertThat(ledger.businessAddress()).isEqualTo(expectedFormatted);
        assertThat(ledger.businessAddress()).doesNotContain("{");
        assertThat(ledger.businessAddress()).doesNotContain("wardCode");
    }

    @Test
    void getSummary_JsonAddress_UsesAddressFormatterService() {
        // Arrange: business có địa chỉ JSON hợp lệ
        String jsonAddress = "{\"detailAddress\":\"12 Trần Hưng Đạo\",\"wardCode\":\"00001\",\"districtCode\":\"001\",\"provinceCode\":\"01\"}";
        mockBusiness = BusinessProfile.builder()
                .id(1L)
                .businessCode("HKD-001")
                .businessName("Tiệm Tạp Hóa An Nhiên")
                .ownerName("Nguyễn Văn An")
                .taxCode("0123456789")
                .address(jsonAddress)
                .build();

        String expectedFormatted = "12 Trần Hưng Đạo, Phường Hàng Bài, Quận Hoàn Kiếm, Thành phố Hà Nội";
        // Override lenient stub bằng stub cụ thể cho jsonAddress
        when(addressFormatterService.formatAddress(jsonAddress)).thenReturn(expectedFormatted);

        when(businessContextService.requireBusinessId("owner")).thenReturn(1L);
        when(businessProfileRepository.findById(1L)).thenReturn(Optional.of(mockBusiness));

        // getSummary với specificProductId=null gọi findAllByBusinessIdOrderByProductNameAsc
        when(productRepository.findAllByBusinessIdOrderByProductNameAsc(1L)).thenReturn(List.of(mockProduct));
        // Lookup units theo batch (findAllById), không phải findById
        when(unitRepository.findAllById(List.of(2L))).thenReturn(List.of(mockUnit));

        // Không có giao dịch trước kỳ
        when(transactionRepository.findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
                eq(1L), eq(10L), any(LocalDateTime.class)
        )).thenReturn(Optional.empty());

        // Một STOCK_IN trong kỳ
        InventoryTransaction tx = InventoryTransaction.builder()
                .id(10L)
                .businessId(1L)
                .productId(10L)
                .transactionType("STOCK_IN")
                .quantityChange(new BigDecimal("10.000"))
                .transactionValue(new BigDecimal("200000.00"))
                .balanceAfter(new BigDecimal("10.000"))
                .balanceValue(new BigDecimal("200000.00"))
                .createdAt(LocalDateTime.of(2026, 9, 10, 10, 0, 0))
                .build();

        when(transactionRepository.findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                eq(1L), eq(10L), any(LocalDateTime.class), any(LocalDateTime.class)
        )).thenReturn(List.of(tx));

        // Act
        InventoryBookkeepingSummaryResponse summary = service.getSummary("owner", null, "2026-09-01", "2026-09-30");

        // Assert: businessAddress phải là chuỗi đã format, không phải JSON thô
        assertThat(summary.businessAddress()).isEqualTo(expectedFormatted);
        assertThat(summary.businessAddress()).doesNotContain("{");
        assertThat(summary.businessAddress()).doesNotContain("wardCode");
    }
}

