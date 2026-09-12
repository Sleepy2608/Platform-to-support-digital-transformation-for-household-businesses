package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Product;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.StockImportItem;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.StockImportResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.StockImportItemRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockImportServiceTest {

    @Mock private StockImportRepository stockImportRepository;
    @Mock private StockImportItemRepository stockImportItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UnitRepository unitRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessContextService businessContextService;
    @Mock private UnitConversionService unitConversionService;
    @Mock private InventoryMovementService inventoryMovementService;

    private StockImportService service;

    @BeforeEach
    void setUp() {
        service = new StockImportService(
                stockImportRepository,
                stockImportItemRepository,
                productRepository,
                unitRepository,
                userRepository,
                businessContextService,
                unitConversionService,
                inventoryMovementService
        );
    }

    @Test
    void confirmSuccessUpdatesInventoryAndStatus() {
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        StockImport stockImport = StockImport.builder()
                .id(importId)
                .businessId(businessId)
                .importCode("NK-20260909-001")
                .status("DRAFT")
                .totalAmount(new BigDecimal("500000.00"))
                .createdBy(5L)
                .createdAt(LocalDateTime.now())
                .importDate(LocalDateTime.now())
                .build();

        StockImportItem item1 = StockImportItem.builder()
                .id(1L)
                .stockImportId(importId)
                .productId(20L)
                .unitId(2L)
                .quantity(new BigDecimal("10.000"))
                .conversionRate(BigDecimal.ONE)
                .baseQuantity(new BigDecimal("10.000"))
                .purchasePrice(new BigDecimal("20000.00"))
                .lineTotal(new BigDecimal("200000.00"))
                .build();

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId))
                .thenReturn(Optional.of(stockImport));
        when(stockImportItemRepository.findAllByStockImportId(importId)).thenReturn(List.of(item1));
        when(userRepository.findById(5L)).thenReturn(Optional.of(User.builder().id(5L).fullName("Chủ Hộ").build()));

        StockImportResponse response = service.confirm(username, importId);

        assertThat(response.status()).isEqualTo("CONFIRMED");
        assertThat(stockImport.getStatus()).isEqualTo("CONFIRMED");
        verify(stockImportRepository).save(stockImport);
        verify(inventoryMovementService, times(1)).stockIn(eq(username), any(InventoryMovementRequest.class));
    }

    @Test
    void confirmRepeatedRequestThrowsBadRequestException() {
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        StockImport alreadyConfirmedImport = StockImport.builder()
                .id(importId)
                .businessId(businessId)
                .importCode("NK-20260909-001")
                .status("CONFIRMED")
                .build();

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId))
                .thenReturn(Optional.of(alreadyConfirmedImport));

        assertThatThrownBy(() -> service.confirm(username, importId))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Phiếu đã được xác nhận, không thể cập nhật tồn kho lần nữa");

        verify(inventoryMovementService, never()).stockIn(any(), any());
        verify(stockImportRepository, never()).save(any());
    }

    @Test
    void confirmSortsItemsByProductIdBeforeStockIn() {
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        StockImport stockImport = StockImport.builder()
                .id(importId)
                .businessId(businessId)
                .importCode("NK-20260909-001")
                .status("DRAFT")
                .totalAmount(new BigDecimal("1000000.00"))
                .createdBy(5L)
                .build();

        // Items ban đầu chưa sắp xếp: 50L, 10L, 30L
        StockImportItem item50 = StockImportItem.builder().id(1L).productId(50L).unitId(1L).quantity(BigDecimal.ONE).purchasePrice(BigDecimal.TEN).build();
        StockImportItem item10 = StockImportItem.builder().id(2L).productId(10L).unitId(1L).quantity(BigDecimal.ONE).purchasePrice(BigDecimal.TEN).build();
        StockImportItem item30 = StockImportItem.builder().id(3L).productId(30L).unitId(1L).quantity(BigDecimal.ONE).purchasePrice(BigDecimal.TEN).build();

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId)).thenReturn(Optional.of(stockImport));
        when(stockImportItemRepository.findAllByStockImportId(importId)).thenReturn(List.of(item50, item10, item30));
        when(userRepository.findById(5L)).thenReturn(Optional.of(User.builder().id(5L).fullName("Chủ Hộ").build()));

        service.confirm(username, importId);

        ArgumentCaptor<InventoryMovementRequest> captor = ArgumentCaptor.forClass(InventoryMovementRequest.class);
        verify(inventoryMovementService, times(3)).stockIn(eq(username), captor.capture());

        List<InventoryMovementRequest> capturedRequests = captor.getAllValues();
        // Kiểm tra thứ tự gọi stockIn phải được sắp xếp theo productId: 10L -> 30L -> 50L
        assertThat(capturedRequests.get(0).getProductId()).isEqualTo(10L);
        assertThat(capturedRequests.get(1).getProductId()).isEqualTo(30L);
        assertThat(capturedRequests.get(2).getProductId()).isEqualTo(50L);
    }

    @Test
    void confirmConcurrentRequestsProcessesExactlyOnce() throws Exception {
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        // Mô phỏng DB lock: chỉ một luồng đọc được status DRAFT tại một thời điểm
        AtomicBoolean isConfirmed = new AtomicBoolean(false);

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId)).thenAnswer(invocation -> {
            synchronized (isConfirmed) {
                if (isConfirmed.get()) {
                    return Optional.of(StockImport.builder().id(importId).businessId(businessId).status("CONFIRMED").createdBy(5L).build());
                } else {
                    isConfirmed.set(true);
                    return Optional.of(StockImport.builder().id(importId).businessId(businessId).status("DRAFT").createdBy(5L).build());
                }
            }
        });

        StockImportItem item = StockImportItem.builder().id(1L).productId(10L).unitId(1L).quantity(BigDecimal.ONE).purchasePrice(BigDecimal.TEN).build();
        when(stockImportItemRepository.findAllByStockImportId(importId)).thenReturn(List.of(item));
        when(userRepository.findById(5L)).thenReturn(Optional.of(User.builder().id(5L).fullName("Chủ Hộ").build()));

        CountDownLatch startLatch = new CountDownLatch(1);
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
        List<StockImportResponse> successResponses = Collections.synchronizedList(new ArrayList<>());

        CompletableFuture<Void> task1 = CompletableFuture.runAsync(() -> {
            try {
                startLatch.await();
                successResponses.add(service.confirm(username, importId));
            } catch (Throwable t) {
                errors.add(t);
            }
        });

        CompletableFuture<Void> task2 = CompletableFuture.runAsync(() -> {
            try {
                startLatch.await();
                successResponses.add(service.confirm(username, importId));
            } catch (Throwable t) {
                errors.add(t);
            }
        });

        startLatch.countDown();
        CompletableFuture.allOf(task1, task2).join();

        // Đúng 1 request thành công và 1 request thất bại vì phiếu đã được confirm
        assertThat(successResponses).hasSize(1);
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0)).isInstanceOf(BadRequestException.class)
                .hasMessage("Phiếu đã được xác nhận, không thể cập nhật tồn kho lần nữa");
        verify(inventoryMovementService, times(1)).stockIn(any(), any());
    }

    @Test
    void confirmRollbacksWhenStockInFails() {
        // Chuẩn bị: stockIn ném exception → status không được đổi thành CONFIRMED
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        StockImport stockImport = StockImport.builder()
                .id(importId)
                .businessId(businessId)
                .importCode("NK-20260909-001")
                .status("DRAFT")
                .totalAmount(new BigDecimal("500000.00"))
                .createdBy(5L)
                .createdAt(LocalDateTime.now())
                .importDate(LocalDateTime.now())
                .build();

        StockImportItem item = StockImportItem.builder()
                .id(1L)
                .stockImportId(importId)
                .productId(20L)
                .unitId(2L)
                .quantity(new BigDecimal("5.000"))
                .purchasePrice(new BigDecimal("10000.00"))
                .build();

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId))
                .thenReturn(Optional.of(stockImport));
        when(stockImportItemRepository.findAllByStockImportId(importId)).thenReturn(List.of(item));
        // stockIn ném exception → @Transactional rollback toàn bộ
        doThrow(new BadRequestException("Sản phẩm không hợp lệ"))
                .when(inventoryMovementService).stockIn(any(), any());

        assertThatThrownBy(() -> service.confirm(username, importId))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Sản phẩm không hợp lệ");

        // status vẫn là DRAFT, stockImportRepository.save() không được gọi
        verify(stockImportRepository, never()).save(any());
        assertThat(stockImport.getStatus()).isEqualTo("DRAFT");
    }

    @Test
    void confirmRollbacksWhenSecondItemFails() {
        // Kiểm tra rollback khi phiếu nhập có nhiều item nhưng item thứ 2 bị lỗi
        Long businessId = 1L;
        Long importId = 100L;
        String username = "owner";

        StockImport stockImport = StockImport.builder()
                .id(importId)
                .businessId(businessId)
                .importCode("NK-20260909-001")
                .status("DRAFT")
                .totalAmount(new BigDecimal("500000.00"))
                .createdBy(5L)
                .build();

        StockImportItem item1 = StockImportItem.builder()
                .id(1L).stockImportId(importId).productId(10L).unitId(1L)
                .quantity(BigDecimal.TEN).purchasePrice(BigDecimal.TEN).build();

        StockImportItem item2 = StockImportItem.builder()
                .id(2L).stockImportId(importId).productId(20L).unitId(2L)
                .quantity(BigDecimal.ONE).purchasePrice(BigDecimal.TEN).build();

        when(businessContextService.requireBusinessId(username)).thenReturn(businessId);
        when(stockImportRepository.findForUpdateByIdAndBusinessId(importId, businessId))
                .thenReturn(Optional.of(stockImport));
        when(stockImportItemRepository.findAllByStockImportId(importId))
                .thenReturn(List.of(item1, item2));

        // Item 1 thành công (doNothing), Item 2 thất bại
        when(inventoryMovementService.stockIn(eq(username), any()))
                .thenReturn(null) // item 1
                .thenThrow(new BadRequestException("Lỗi ghi nhận kho item 2")); // item 2

        assertThatThrownBy(() -> service.confirm(username, importId))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Lỗi ghi nhận kho item 2");

        // Khi có item lỗi, toàn bộ transaction rollback: trạng thái phiếu nhập vẫn là DRAFT, không được lưu CONFIRMED
        verify(stockImportRepository, never()).save(any());
        assertThat(stockImport.getStatus()).isEqualTo("DRAFT");
    }
}

