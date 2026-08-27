package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryAlert;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.enums.InventoryAlertStatus;
import com.hbdt.inventory.dto.StockThresholdResponse;
import com.hbdt.inventory.dto.LowStockAlertResponse;
import com.hbdt.inventory.dto.LowStockSummaryResponse;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.InventoryAlertRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LowStockAlertServiceTest {

    @Mock private BusinessContextService businessContextService;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryBalanceRepository balanceRepository;
    @Mock private InventoryAlertRepository alertRepository;
    @Mock private NotificationService notificationService;

    private LowStockAlertService service;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new LowStockAlertService(
                businessContextService, productRepository, balanceRepository,
                alertRepository, notificationService);
        product = Product.builder()
                .id(11L)
                .businessId(7L)
                .productCode("SP-01")
                .productName("Cà phê")
                .minimumStock(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build();
    }

    @Test
    void configureThresholdPersistsAndEvaluatesCurrentBalance() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L)).thenReturn(Optional.of(
                InventoryBalance.builder().quantityOnHand(new BigDecimal("8.000")).build()));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of());
        when(alertRepository.save(any(InventoryAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockThresholdResponse response = service.configureThreshold(
                "owner", 11L, new BigDecimal("12.000"));

        assertThat(product.getMinimumStock()).isEqualByComparingTo("12.000");
        assertThat(response.lowStock()).isTrue();
        verify(notificationService).notifyLowStock(
                7L, product, new BigDecimal("8.000"), new BigDecimal("12.000"));
    }

    @Test
    void evaluateCreatesOneActiveAlertWhenQuantityDropsBelowThreshold() {
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of());
        when(alertRepository.save(any(InventoryAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LowStockAlertService.EvaluationResult result = service.evaluate(
                7L, 11L, new BigDecimal("4.000"));

        assertThat(result.created()).isTrue();
        assertThat(result.alert().getStatus()).isEqualTo(InventoryAlertStatus.ACTIVE);
        assertThat(result.alert().getQuantitySnapshot()).isEqualByComparingTo("4.000");
        verify(notificationService).notifyLowStock(
                7L, product, new BigDecimal("4.000"), new BigDecimal("10.000"));
    }

    @Test
    void evaluateUpdatesExistingAlertWithoutCreatingDuplicateNotification() {
        InventoryAlert active = InventoryAlert.builder()
                .id(99L).businessId(7L).productId(11L)
                .status(InventoryAlertStatus.ACTIVE)
                .quantitySnapshot(new BigDecimal("7.000"))
                .thresholdSnapshot(new BigDecimal("10.000"))
                .build();
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of(active));

        LowStockAlertService.EvaluationResult result = service.evaluate(
                7L, 11L, new BigDecimal("3.000"));

        assertThat(result.created()).isFalse();
        assertThat(active.getQuantitySnapshot()).isEqualByComparingTo("3.000");
        verify(notificationService, never()).notifyLowStock(any(), any(), any(), any());
    }

    @Test
    void evaluateResolvesAlertAfterStockReturnsToSafeLevel() {
        InventoryAlert active = InventoryAlert.builder()
                .id(99L).businessId(7L).productId(11L)
                .status(InventoryAlertStatus.ACTIVE)
                .quantitySnapshot(new BigDecimal("5.000"))
                .thresholdSnapshot(new BigDecimal("10.000"))
                .build();
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of(active));

        LowStockAlertService.EvaluationResult result = service.evaluate(
                7L, 11L, new BigDecimal("10.000"));

        assertThat(result.resolved()).isTrue();
        assertThat(active.getStatus()).isEqualTo(InventoryAlertStatus.RESOLVED);
        assertThat(active.getResolvedAt()).isNotNull();
        verify(notificationService).notifyStockRecovered(7L, product, new BigDecimal("10.000"));
    }

    @Test
    void configureThresholdRejectsNegativeValueBeforeWritingData() {
        assertThatThrownBy(() -> service.configureThreshold(
                "owner", 11L, new BigDecimal("-1")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không được âm");
        verify(productRepository, never()).save(any());
    }

    @Test
    void configureThresholdRejectsFractionalValueBeforeWritingData() {
        assertThatThrownBy(() -> service.configureThreshold(
                "owner", 11L, new BigDecimal("5.006")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("số nguyên");
        verify(productRepository, never()).save(any());
    }

    @Test
    void evaluateResolvesDuplicateActiveAlertsDefensively() {
        InventoryAlert primary = activeAlert(1L);
        InventoryAlert duplicate = activeAlert(2L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of(primary, duplicate));

        service.evaluate(7L, 11L, new BigDecimal("2.000"));

        assertThat(primary.getStatus()).isEqualTo(InventoryAlertStatus.ACTIVE);
        assertThat(duplicate.getStatus()).isEqualTo(InventoryAlertStatus.RESOLVED);
        verify(notificationService, never()).notifyLowStock(any(), any(), any(), any());
    }

    @Test
    void getThresholdsReturnsOnlyActiveProductsInAlphabeticalRepositoryOrder() {
        Product secondProduct = Product.builder()
                .id(12L)
                .businessId(7L)
                .productCode("SP-02")
                .productName("Trà")
                .minimumStock(null)
                .status("ACTIVE")
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(7L, "ACTIVE"))
                .thenReturn(List.of(product, secondProduct));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.of(InventoryBalance.builder()
                        .quantityOnHand(new BigDecimal("4.000"))
                        .build()));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 12L))
                .thenReturn(Optional.empty());

        List<StockThresholdResponse> result = service.getThresholds("owner");

        assertThat(result).hasSize(2);
        assertThat(result.get(0)).satisfies(item -> {
            assertThat(item.productId()).isEqualTo(11L);
            assertThat(item.quantityOnHand()).isEqualByComparingTo("4.000");
            assertThat(item.configured()).isTrue();
            assertThat(item.lowStock()).isTrue();
        });
        assertThat(result.get(1)).satisfies(item -> {
            assertThat(item.productId()).isEqualTo(12L);
            assertThat(item.quantityOnHand()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(item.configured()).isFalse();
            assertThat(item.lowStock()).isFalse();
        });
    }

    @Test
    void evaluateResolvesAlertSilentlyWhenProductIsInactive() {
        product.setStatus("INACTIVE");
        InventoryAlert active = activeAlert(99L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of(active));

        LowStockAlertService.EvaluationResult result = service.synchronizeProductStatus(7L, 11L);

        assertThat(result.resolved()).isTrue();
        assertThat(active.getStatus()).isEqualTo(InventoryAlertStatus.RESOLVED);
        verify(notificationService, never()).notifyStockRecovered(any(), any(), any());
        verify(notificationService, never()).notifyLowStock(any(), any(), any(), any());
    }

    @Test
    void activeAlertListOmitsInactiveProductsButHistoryKeepsThem() {
        product.setStatus("INACTIVE");
        InventoryAlert active = activeAlert(1L);
        when(businessContextService.requireBusinessId("employee")).thenReturn(7L);
        when(alertRepository.findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
                7L, InventoryAlertStatus.ACTIVE)).thenReturn(List.of(active));
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));

        assertThat(service.getAlerts("employee", false)).isEmpty();
    }

    @Test
    void getAlertsReturnsOnlyActiveRowsByDefault() {
        InventoryAlert active = activeAlert(1L);
        when(businessContextService.requireBusinessId("employee")).thenReturn(7L);
        when(alertRepository.findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
                7L, InventoryAlertStatus.ACTIVE)).thenReturn(List.of(active));
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.of(InventoryBalance.builder()
                        .quantityOnHand(new BigDecimal("2.500"))
                        .build()));

        List<LowStockAlertResponse> result = service.getAlerts("employee", false);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(1L);
            assertThat(item.productCode()).isEqualTo("SP-01");
            assertThat(item.quantityOnHand()).isEqualByComparingTo("2.500");
            assertThat(item.minimumStock()).isEqualByComparingTo("10.000");
            assertThat(item.status()).isEqualTo("ACTIVE");
            assertThat(item.needsRestock()).isTrue();
        });
    }

    @Test
    void getAlertsHistoryUsesThresholdSnapshotWhenProductThresholdWasRemoved() {
        product.setMinimumStock(null);
        InventoryAlert resolved = InventoryAlert.builder()
                .id(3L)
                .businessId(7L)
                .productId(11L)
                .status(InventoryAlertStatus.RESOLVED)
                .quantitySnapshot(BigDecimal.ONE)
                .thresholdSnapshot(new BigDecimal("6.000"))
                .resolvedAt(java.time.LocalDateTime.now())
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(alertRepository.findAllByBusinessIdOrderByTriggeredAtDesc(7L))
                .thenReturn(List.of(resolved));
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.of(InventoryBalance.builder()
                        .quantityOnHand(new BigDecimal("9.000"))
                        .build()));

        List<LowStockAlertResponse> result = service.getAlerts("owner", true);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.minimumStock()).isEqualByComparingTo("6.000");
            assertThat(item.status()).isEqualTo("RESOLVED");
            assertThat(item.needsRestock()).isFalse();
        });
    }

    @Test
    void getSummaryClampsRequestedLimitToOne() {
        InventoryAlert first = activeAlert(1L);
        InventoryAlert second = activeAlert(2L);
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(alertRepository.findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
                7L, InventoryAlertStatus.ACTIVE)).thenReturn(List.of(first, second));
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.of(InventoryBalance.builder()
                        .quantityOnHand(BigDecimal.ONE)
                        .build()));

        LowStockSummaryResponse result = service.getSummary("owner", 0);

        assertThat(result.totalLowStock()).isEqualTo(2);
        assertThat(result.products()).hasSize(1);
    }

    @Test
    void getSummaryClampsRequestedLimitToOneHundred() {
        List<InventoryAlert> alerts = java.util.stream.LongStream.rangeClosed(1, 105)
                .mapToObj(this::activeAlert)
                .toList();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(alertRepository.findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
                7L, InventoryAlertStatus.ACTIVE)).thenReturn(alerts);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.of(InventoryBalance.builder()
                        .quantityOnHand(BigDecimal.ONE)
                        .build()));

        LowStockSummaryResponse result = service.getSummary("owner", 1000);

        assertThat(result.totalLowStock()).isEqualTo(105);
        assertThat(result.products()).hasSize(100);
    }

    @Test
    void evaluateTreatsQuantityEqualToThresholdAsSafe() {
        InventoryAlert active = activeAlert(1L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of(active));

        LowStockAlertService.EvaluationResult result = service.evaluate(
                7L, 11L, new BigDecimal("10.000"));

        assertThat(result.resolved()).isTrue();
        assertThat(active.getStatus()).isEqualTo(InventoryAlertStatus.RESOLVED);
        verify(notificationService).notifyStockRecovered(
                7L, product, new BigDecimal("10.000"));
    }

    @Test
    void evaluateDoesNothingWhenThresholdIsNotConfigured() {
        product.setMinimumStock(null);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of());

        LowStockAlertService.EvaluationResult result = service.evaluate(
                7L, 11L, BigDecimal.ZERO);

        assertThat(result.alert()).isNull();
        assertThat(result.created()).isFalse();
        assertThat(result.resolved()).isFalse();
        verify(alertRepository, never()).save(any(InventoryAlert.class));
        verify(notificationService, never()).notifyLowStock(any(), any(), any(), any());
    }

    @Test
    void configureThresholdAcceptsZeroAndDoesNotCreateAlertAtZeroQuantity() {
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L))
                .thenReturn(Optional.empty());
        when(alertRepository.findActiveForUpdate(7L, 11L)).thenReturn(List.of());

        StockThresholdResponse result = service.configureThreshold(
                "owner", 11L, BigDecimal.ZERO);

        assertThat(result.minimumStock()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.lowStock()).isFalse();
        verify(productRepository).save(product);
        verify(notificationService, never()).notifyLowStock(any(), any(), any(), any());
    }

    @Test
    void evaluateRejectsProductFromAnotherBusiness() {
        when(productRepository.findByIdAndBusinessId(11L, 999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.evaluate(999L, 11L, BigDecimal.ONE))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("sản phẩm");
        verify(alertRepository, never()).findActiveForUpdate(any(), any());
    }

    private InventoryAlert activeAlert(Long id) {
        return InventoryAlert.builder()
                .id(id).businessId(7L).productId(11L)
                .status(InventoryAlertStatus.ACTIVE)
                .quantitySnapshot(BigDecimal.ONE)
                .thresholdSnapshot(BigDecimal.TEN)
                .build();
    }
}
