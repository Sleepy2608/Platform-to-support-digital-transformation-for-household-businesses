package com.hbdt.inventory.service;

import com.hbdt.common.dto.PageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryAdjustmentRequest;
import com.hbdt.inventory.dto.InventoryAdjustmentResponse;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.inventory.dto.InventoryTransactionFilterRequest;
import com.hbdt.inventory.dto.InventoryTransactionResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryMovementServiceTest {

    @Mock private BusinessContextService businessContextService;
    @Mock private UnitConversionService unitConversionService;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private UserRepository userRepository;
    @Mock private InventoryBalanceRepository balanceRepository;
    @Mock private InventoryTransactionRepository transactionRepository;
    @Mock private LowStockAlertService lowStockAlertService;
    @Mock private StockImportRepository stockImportRepository;
    @Mock private SalesOrderRepository salesOrderRepository;

    private InventoryMovementService service;

    @BeforeEach
    void setUp() {
        service = new InventoryMovementService(
                businessContextService, unitConversionService, productRepository,
                unitRepository, userRepository, balanceRepository, transactionRepository,
                lowStockAlertService, stockImportRepository, salesOrderRepository
        );
    }

    @Test
    void stockInConvertsEnteredQuantityAndUpdatesBalanceInBaseUnit() {
        mockContextAndConversion(new BigDecimal("2"), new BigDecimal("10"), new BigDecimal("20.000"));
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.empty());
        when(balanceRepository.save(any(InventoryBalance.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction transaction = invocation.getArgument(0);
            transaction.setId(99L);
            return transaction;
        });

        InventoryMovementResponse response = service.stockIn(
                "owner",
                new InventoryMovementRequest(
                        11L, 2L, new BigDecimal("2"), new BigDecimal("100"), 5L, "Nhập hàng"
                )
        );

        assertThat(response.baseQuantity()).isEqualByComparingTo("20.000");
        assertThat(response.balanceAfter()).isEqualByComparingTo("20.000");
        assertThat(response.averageUnitCost()).isEqualByComparingTo("10.00");
        assertThat(response.inventoryValue()).isEqualByComparingTo("200.00");
        assertThat(response.transactionType()).isEqualTo("STOCK_IN");
    }

    @Test
    void stockOutRejectsQuantityGreaterThanBaseBalance() {
        mockContextAndConversion(new BigDecimal("3"), new BigDecimal("10"), new BigDecimal("30.000"));
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(
                InventoryBalance.builder()
                        .businessId(7L)
                        .productId(11L)
                        .quantityOnHand(new BigDecimal("20.000"))
                        .averageUnitCost(new BigDecimal("10.00"))
                        .inventoryValue(new BigDecimal("200.00"))
                        .build()
        ));

        assertThatThrownBy(() -> service.stockOut(
                "owner",
                new InventoryMovementRequest(11L, 2L, new BigDecimal("3"), null, null, null)
        )).isInstanceOf(BadRequestException.class)
                .hasMessage("Số lượng xuất vượt quá số lượng tồn kho");
    }

    @Test
    void stockMovementRejectsFractionForNonKgAndNonLiterUnit() {
        BigDecimal quantity = new BigDecimal("1.5");
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        Unit bagUnit = Unit.builder().id(2L).unitCode("BAO").unitName("Bao").status("ACTIVE").build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(unitRepository.findByIdAndStatus(2L, "ACTIVE")).thenReturn(Optional.of(bagUnit));

        assertThatThrownBy(() -> service.stockOut(
                "owner", new InventoryMovementRequest(11L, 2L, quantity, null, null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ đơn vị kg và lít được phép nhập số lượng thập phân");
    }

    @Test
    void restoreCancelledSaleReturnsQuantityAndOriginalCostToInventory() {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(new BigDecimal("8.000"))
                .averageUnitCost(new BigDecimal("10.00"))
                .inventoryValue(new BigDecimal("80.00"))
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(balance));
        when(transactionRepository
                .findFirstByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndQuantityChangeLessThanOrderByIdDesc(
                        7L, 11L, "SALES_ORDER", 100L, BigDecimal.ZERO))
                .thenReturn(Optional.of(InventoryTransaction.builder()
                        .unitCost(new BigDecimal("10.00")).build()));

        service.restoreCancelledSale("owner", 11L, new BigDecimal("2.000"), 100L, "SO-004");

        assertThat(balance.getQuantityOnHand()).isEqualByComparingTo("10.000");
        assertThat(balance.getInventoryValue()).isEqualByComparingTo("100.00");
        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getTransactionType()).isEqualTo("CANCEL_SALE");
        assertThat(captor.getValue().getQuantityChange()).isEqualByComparingTo("2.000");
        assertThat(captor.getValue().getBalanceAfter()).isEqualByComparingTo("10.000");
    }

    @Test
    void stockInRejectsDuplicateImportItem() {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                7L, 11L, "STOCK_IMPORT", 5L, "STOCK_IN")).thenReturn(true);

        assertThatThrownBy(() -> service.stockIn(
                "owner",
                new InventoryMovementRequest(11L, 2L, new BigDecimal("2"), new BigDecimal("100"), 5L, "Nhập hàng")
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    void stockOutRejectsDuplicateOrderItem() {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                7L, 11L, "SALES_ORDER", 50L, "STOCK_OUT")).thenReturn(true);

        assertThatThrownBy(() -> service.stockOut(
                "owner",
                new InventoryMovementRequest(11L, 2L, new BigDecimal("2"), null, 50L, "Xuất đơn")
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    void restoreCancelledSaleRejectsDuplicateCancellation() {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                7L, 11L, "SALES_ORDER", 100L, "CANCEL_SALE")).thenReturn(true);

        assertThatThrownBy(() -> service.restoreCancelledSale(
                "owner", 11L, new BigDecimal("2.000"), 100L, "SO-004"
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được hoàn kho trước đó");
    }

    @Test
    void lockOrCreateBalanceSafelyHandlesConcurrentCreation() {
        mockContextAndConversion(new BigDecimal("2"), new BigDecimal("10"), new BigDecimal("20.000"));
        InventoryBalance createdByOtherThread = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(BigDecimal.ZERO.setScale(3))
                .averageUnitCost(BigDecimal.ZERO.setScale(2))
                .inventoryValue(BigDecimal.ZERO.setScale(2))
                .build();

        // Lần 1: findForUpdate rỗng; saveAndFlush bị race condition ném exception; lần 2: findForUpdate tìm thấy
        when(balanceRepository.findForUpdate(7L, 11L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(createdByOtherThread));
        when(balanceRepository.save(any(InventoryBalance.class)))
                .thenThrow(new RuntimeException("Duplicate entry '7-11' for key 'uk_inventory_balances_business_product'"))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction transaction = invocation.getArgument(0);
            transaction.setId(101L);
            return transaction;
        });

        InventoryMovementResponse response = service.stockIn(
                "owner",
                new InventoryMovementRequest(11L, 2L, new BigDecimal("2"), new BigDecimal("100"), 5L, "Nhập hàng")
        );

        assertThat(response.baseQuantity()).isEqualByComparingTo("20.000");
        assertThat(response.balanceAfter()).isEqualByComparingTo("20.000");
    }

    @Test
    void adjustStockSetIncreasesBalanceAndRecordsAdjustmentTransaction() {
        mockContextAndConversion(new BigDecimal("3"), new BigDecimal("10"), new BigDecimal("30.000"));
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(new BigDecimal("20.000"))
                .averageUnitCost(new BigDecimal("15.00"))
                .inventoryValue(new BigDecimal("300.00"))
                .build();
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(balance));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(201L);
            return tx;
        });

        InventoryAdjustmentResponse response = service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L)
                        .unitId(2L)
                        .quantity(new BigDecimal("3"))
                        .adjustmentType("SET")
                        .reason("Kiểm kê định kỳ phát hiện thừa 1 thùng")
                        .build()
        );

        assertThat(response.transactionId()).isEqualTo(201L);
        assertThat(response.balanceBefore()).isEqualByComparingTo("20.000");
        assertThat(response.balanceAfter()).isEqualByComparingTo("30.000");
        assertThat(response.quantityChange()).isEqualByComparingTo("10.000");
        assertThat(response.transactionValue()).isEqualByComparingTo("150.00");
        assertThat(response.balanceValue()).isEqualByComparingTo("450.00");
        assertThat(response.adjustmentType()).isEqualTo("SET");
        assertThat(response.reason()).isEqualTo("Kiểm kê định kỳ phát hiện thừa 1 thùng");

        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getTransactionType()).isEqualTo("ADJUSTMENT");
        assertThat(captor.getValue().getReferenceType()).isEqualTo("STOCK_ADJUSTMENT");
        assertThat(captor.getValue().getQuantityChange()).isEqualByComparingTo("10.000");
        assertThat(captor.getValue().getBalanceAfter()).isEqualByComparingTo("30.000");
        assertThat(captor.getValue().getNote()).contains("Kiểm kê");
    }

    @Test
    void adjustStockSetDecreasesBalanceAndRecordsAdjustmentTransaction() {
        mockContextAndConversion(new BigDecimal("1"), new BigDecimal("10"), new BigDecimal("10.000"));
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(new BigDecimal("20.000"))
                .averageUnitCost(new BigDecimal("15.00"))
                .inventoryValue(new BigDecimal("300.00"))
                .build();
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(balance));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(202L);
            return tx;
        });

        InventoryAdjustmentResponse response = service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L)
                        .unitId(2L)
                        .quantity(new BigDecimal("1"))
                        .adjustmentType("SET")
                        .reason("Hàng hỏng do ẩm ướt")
                        .build()
        );

        assertThat(response.balanceBefore()).isEqualByComparingTo("20.000");
        assertThat(response.balanceAfter()).isEqualByComparingTo("10.000");
        assertThat(response.quantityChange()).isEqualByComparingTo("-10.000");
        assertThat(response.balanceValue()).isEqualByComparingTo("150.00");
    }

    @Test
    void adjustStockSupportsIncreaseAndDecreaseTypes() {
        mockContextAndConversion(new BigDecimal("1"), new BigDecimal("10"), new BigDecimal("10.000"));
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(new BigDecimal("20.000"))
                .averageUnitCost(new BigDecimal("15.00"))
                .inventoryValue(new BigDecimal("300.00"))
                .build();
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(balance));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // INCREASE
        InventoryAdjustmentResponse incResponse = service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L).unitId(2L).quantity(new BigDecimal("1"))
                        .adjustmentType("INCREASE").reason("Bổ sung hàng mẫu").build()
        );
        assertThat(incResponse.balanceAfter()).isEqualByComparingTo("30.000");
        assertThat(incResponse.quantityChange()).isEqualByComparingTo("10.000");

        // DECREASE
        InventoryAdjustmentResponse decResponse = service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L).unitId(2L).quantity(new BigDecimal("1"))
                        .adjustmentType("DECREASE").reason("Xuất hủy hết hạn").build()
        );
        // Từ 30.000 giảm 10.000 -> 20.000
        assertThat(decResponse.balanceAfter()).isEqualByComparingTo("20.000");
        assertThat(decResponse.quantityChange()).isEqualByComparingTo("-10.000");
    }

    @Test
    void adjustStockRejectsNegativeResultingBalance() {
        mockContextAndConversion(new BigDecimal("3"), new BigDecimal("10"), new BigDecimal("30.000"));
        InventoryBalance balance = InventoryBalance.builder()
                .businessId(7L).productId(11L)
                .quantityOnHand(new BigDecimal("20.000"))
                .averageUnitCost(new BigDecimal("15.00"))
                .inventoryValue(new BigDecimal("300.00"))
                .build();
        when(balanceRepository.findForUpdate(7L, 11L)).thenReturn(Optional.of(balance));

        // Giảm 30 trong khi chỉ có 20
        assertThatThrownBy(() -> service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L).unitId(2L).quantity(new BigDecimal("3"))
                        .adjustmentType("DECREASE").reason("Giảm quá mức").build()
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vượt quá số lượng tồn hiện tại");
    }

    @Test
    void adjustStockRejectsBlankReason() {
        assertThatThrownBy(() -> service.adjustStock(
                "owner",
                InventoryAdjustmentRequest.builder()
                        .productId(11L).unitId(2L).quantity(BigDecimal.ONE)
                        .reason("   ").build()
        )).isInstanceOf(BadRequestException.class)
                .hasMessage("Lý do điều chỉnh không được để trống");
    }

    @Test
    void getTransactions_TenantIsolation_EnforcesBusinessIdInSpecification() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder().build();
        service.getTransactions("owner", filter);

        ArgumentCaptor<Specification<InventoryTransaction>> specCaptor =
                ArgumentCaptor.forClass(Specification.class);
        verify(transactionRepository).findAll(specCaptor.capture(), any(Pageable.class));

        Specification<InventoryTransaction> spec = specCaptor.getValue();
        Root<InventoryTransaction> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);
        Path<Object> businessIdPath = mock(Path.class);
        Predicate businessIdPredicate = mock(Predicate.class);

        when(root.get("businessId")).thenReturn(businessIdPath);
        when(cb.equal(businessIdPath, 7L)).thenReturn(businessIdPredicate);

        spec.toPredicate(root, query, cb);

        verify(root).get("businessId");
        verify(cb).equal(businessIdPath, 7L);
    }

    @Test
    void getTransactions_AllFilters_ConstructsAllPredicates() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(Page.empty());

        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder()
                .productId(11L)
                .transactionType("ADJUSTMENT")
                .referenceType("STOCK_ADJUSTMENT")
                .referenceId(99L)
                .from("2026-09-01")
                .to("2026-09-09")
                .page(0)
                .size(10)
                .build();

        service.getTransactions("owner", filter);

        ArgumentCaptor<Specification<InventoryTransaction>> specCaptor =
                ArgumentCaptor.forClass(Specification.class);
        verify(transactionRepository).findAll(specCaptor.capture(), any(Pageable.class));

        Specification<InventoryTransaction> spec = specCaptor.getValue();
        Root<InventoryTransaction> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        Path<Object> businessIdPath = mock(Path.class);
        Path<Object> productIdPath = mock(Path.class);
        Path<Object> txTypePath = mock(Path.class);
        Path<Object> refTypePath = mock(Path.class);
        Path<Object> refIdPath = mock(Path.class);
        Path<LocalDateTime> createdAtPath = mock(Path.class);

        when(root.get("businessId")).thenReturn(businessIdPath);
        when(root.get("productId")).thenReturn(productIdPath);
        when(root.get("transactionType")).thenReturn(txTypePath);
        when(root.get("referenceType")).thenReturn(refTypePath);
        when(root.get("referenceId")).thenReturn(refIdPath);
        when(root.<LocalDateTime>get("createdAt")).thenReturn(createdAtPath);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(businessIdPath, 7L);
        verify(cb).equal(productIdPath, 11L);
        verify(cb).equal(txTypePath, "ADJUSTMENT");
        verify(cb).equal(refTypePath, "STOCK_ADJUSTMENT");
        verify(cb).equal(refIdPath, 99L);
        verify(cb).greaterThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class));
        verify(cb).lessThanOrEqualTo(eq(createdAtPath), any(LocalDateTime.class));
    }

    @Test
    void getTransactions_ReturnsMappedResponseWithBatchLoading() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);

        LocalDateTime now = LocalDateTime.now();
        InventoryTransaction tx = InventoryTransaction.builder()
                .id(101L)
                .businessId(7L)
                .productId(11L)
                .unitId(2L)
                .enteredQuantity(new BigDecimal("2.000"))
                .conversionRate(new BigDecimal("10.000000"))
                .createdBy(3L)
                .transactionType("STOCK_IN")
                .referenceType("STOCK_IMPORT")
                .referenceId(55L)
                .quantityChange(new BigDecimal("20.000"))
                .balanceAfter(new BigDecimal("50.000"))
                .unitCost(new BigDecimal("100.00"))
                .transactionValue(new BigDecimal("200.00"))
                .note("Nhập hàng từ phiếu NK-01")
                .createdAt(now)
                .build();

        Page<InventoryTransaction> page = new PageImpl<>(List.of(tx));
        when(transactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        Product product = Product.builder().id(11L).productCode("SP-01").productName("Sữa bột").baseUnitId(1L).build();
        Unit unit = Unit.builder().id(2L).unitName("Thùng").build();
        User user = User.builder().id(3L).fullName("Nguyễn Chủ Quán").username("owner").build();

        when(productRepository.findAllById(List.of(11L))).thenReturn(List.of(product));
        when(unitRepository.findAllById(any())).thenReturn(List.of(unit));
        when(userRepository.findAllById(List.of(3L))).thenReturn(List.of(user));
        // Batch-load chứng từ nguồn: STOCK_IMPORT referenceId=55 → importCode "NK-20260101-001"
        StockImport stockImport = StockImport.builder()
                .id(55L).importCode("NK-20260101-001").build();
        when(stockImportRepository.findAllById(List.of(55L))).thenReturn(List.of(stockImport));
        when(salesOrderRepository.findAllById(any())).thenReturn(List.of());

        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder().build();
        PageResponse<InventoryTransactionResponse> response = service.getTransactions("owner", filter);

        assertThat(response.content()).hasSize(1);
        InventoryTransactionResponse item = response.content().get(0);
        assertThat(item.transactionId()).isEqualTo(101L);
        assertThat(item.productId()).isEqualTo(11L);
        assertThat(item.productName()).isEqualTo("Sữa bột");
        assertThat(item.productCode()).isEqualTo("SP-01");
        assertThat(item.transactionType()).isEqualTo("STOCK_IN");
        assertThat(item.referenceType()).isEqualTo("STOCK_IMPORT");
        assertThat(item.referenceId()).isEqualTo(55L);
        // referenceCode phải được resolve từ importCode
        assertThat(item.referenceCode()).isEqualTo("NK-20260101-001");
        assertThat(item.enteredQuantity()).isEqualByComparingTo("2.000");
        assertThat(item.baseQuantity()).isEqualByComparingTo("20.000");
        assertThat(item.quantityBefore()).isEqualByComparingTo("30.000"); // 50.000 - 20.000
        assertThat(item.quantityChange()).isEqualByComparingTo("20.000");
        assertThat(item.quantityAfter()).isEqualByComparingTo("50.000");
        assertThat(item.unitName()).isEqualTo("Thùng");
        assertThat(item.unitCost()).isEqualByComparingTo("100.00");
        assertThat(item.transactionValue()).isEqualByComparingTo("200.00");
        assertThat(item.note()).isEqualTo("Nhập hàng từ phiếu NK-01");
        assertThat(item.createdByName()).isEqualTo("Nguyễn Chủ Quán");
        assertThat(item.createdAt()).isEqualTo(now);
    }

    @Test
    void getTransactions_InvalidDateRange_ThrowsBadRequestException() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);

        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder()
                .from("2026-09-10")
                .to("2026-09-01")
                .build();

        assertThatThrownBy(() -> service.getTransactions("owner", filter))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời gian 'from' không được lớn hơn 'to'");
    }

    @Test
    void getTransactions_InvalidDateFormat_ThrowsBadRequestException() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);

        InventoryTransactionFilterRequest filter = InventoryTransactionFilterRequest.builder()
                .from("not-a-date")
                .build();

        assertThatThrownBy(() -> service.getTransactions("owner", filter))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Định dạng ngày không hợp lệ");
    }

    private void mockContextAndConversion(BigDecimal quantity, BigDecimal rate, BigDecimal baseQuantity) {
        Product product = Product.builder().id(11L).businessId(7L).baseUnitId(1L).build();
        User user = User.builder().id(3L).businessId(7L).username("owner").build();
        Unit baseUnit = Unit.builder().id(1L).unitCode("BAO").unitName("Bao").status("ACTIVE").build();
        Unit enteredUnit = Unit.builder().id(2L).unitCode("THUNG").unitName("Thùng").status("ACTIVE").build();

        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(unitRepository.findByIdAndStatus(2L, "ACTIVE")).thenReturn(Optional.of(enteredUnit));
        when(unitRepository.findByIdAndStatus(1L, "ACTIVE")).thenReturn(Optional.of(baseUnit));
        when(unitConversionService.getConversionRate("owner", 11L, 2L)).thenReturn(rate);
        when(unitConversionService.toBaseQuantity("owner", 11L, 2L, quantity))
                .thenReturn(baseQuantity);
    }
}

