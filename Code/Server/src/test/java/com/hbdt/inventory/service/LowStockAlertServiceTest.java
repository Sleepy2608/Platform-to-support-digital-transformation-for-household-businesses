package com.hbdt.inventory.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Product;
import com.hbdt.entity.SystemConfiguration;
import com.hbdt.entity.User;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SystemConfigurationRepository;
import com.hbdt.repository.UserRepository;
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
    @Mock private SystemConfigurationRepository configurationRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    private LowStockAlertService service;

    @BeforeEach
    void setUp() {
        service = new LowStockAlertService(
                businessContextService,
                productRepository,
                balanceRepository,
                configurationRepository,
                userRepository,
                notificationService);
    }

    @Test
    void configureThresholdStoresNumberInExistingConfigurationTable() {
        Product product = activeProduct(11L, "SP-11", "Sữa hộp");
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(User.builder().id(9L).build()));
        when(configurationRepository.findByConfigKey("inventory.low-stock.7.11"))
                .thenReturn(Optional.empty());
        when(configurationRepository.save(any(SystemConfiguration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L)).thenReturn(Optional.empty());
        when(notificationService.notifyLowStock(
                7L, product, BigDecimal.ZERO, new BigDecimal("5"))).thenReturn(true);

        var response = service.configureThreshold("owner", 11L, new BigDecimal("5"));

        ArgumentCaptor<SystemConfiguration> captor =
                ArgumentCaptor.forClass(SystemConfiguration.class);
        verify(configurationRepository).save(captor.capture());
        assertThat(captor.getValue().getConfigKey()).isEqualTo("inventory.low-stock.7.11");
        assertThat(captor.getValue().getConfigValue().decimalValue()).isEqualByComparingTo("5");
        assertThat(captor.getValue().getUpdatedBy()).isEqualTo(9L);
        assertThat(response.configured()).isTrue();
        assertThat(response.lowStock()).isTrue();
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void configureThresholdRejectsDecimalValues() {
        assertThatThrownBy(() -> service.configureThreshold(
                "owner", 11L, new BigDecimal("1.5")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("số nguyên");
    }

    @Test
    void getThresholdsReadsTenantSpecificConfiguration() {
        Product product = activeProduct(11L, "SP-11", "Sữa hộp");
        SystemConfiguration configuration = SystemConfiguration.builder()
                .configKey("inventory.low-stock.7.11")
                .configValue(JsonNodeFactory.instance.numberNode(6))
                .dataType("NUMBER")
                .publicConfig(false)
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(configurationRepository.findAllByConfigKeyStartingWith("inventory.low-stock.7."))
                .thenReturn(List.of(configuration));
        when(productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(7L, "ACTIVE"))
                .thenReturn(List.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L)).thenReturn(Optional.empty());

        var thresholds = service.getThresholds("owner");

        assertThat(thresholds).singleElement().satisfies(item -> {
            assertThat(item.minimumStock()).isEqualByComparingTo("6");
            assertThat(item.configured()).isTrue();
            assertThat(item.lowStock()).isTrue();
        });
    }

    @Test
    void getAlertsCalculatesCurrentLowStockWithoutAlertTable() {
        Product product = activeProduct(11L, "SP-11", "Sữa hộp");
        SystemConfiguration configuration = SystemConfiguration.builder()
                .configKey("inventory.low-stock.7.11")
                .configValue(JsonNodeFactory.instance.numberNode(10))
                .dataType("NUMBER")
                .publicConfig(false)
                .build();
        when(businessContextService.requireBusinessId("owner")).thenReturn(7L);
        when(configurationRepository.findAllByConfigKeyStartingWith("inventory.low-stock.7."))
                .thenReturn(List.of(configuration));
        when(productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(7L, "ACTIVE"))
                .thenReturn(List.of(product));
        when(balanceRepository.findByBusinessIdAndProductId(7L, 11L)).thenReturn(Optional.empty());

        var alerts = service.getAlerts("owner");

        assertThat(alerts).singleElement().satisfies(alert -> {
            assertThat(alert.productId()).isEqualTo(11L);
            assertThat(alert.minimumStock()).isEqualByComparingTo("10");
            assertThat(alert.quantityOnHand()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(alert.needsRestock()).isTrue();
        });
    }

    @Test
    void evaluateCreatesOnlyOneGenericNotificationTransition() {
        Product product = activeProduct(11L, "SP-11", "Sữa hộp");
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(configurationRepository.findByConfigKey("inventory.low-stock.7.11"))
                .thenReturn(Optional.of(SystemConfiguration.builder()
                        .configValue(JsonNodeFactory.instance.numberNode(5))
                        .build()));
        when(notificationService.notifyLowStock(
                7L, product, new BigDecimal("2"), new BigDecimal("5"))).thenReturn(true);

        var result = service.evaluate(7L, 11L, new BigDecimal("2"));

        assertThat(result.lowStock()).isTrue();
        assertThat(result.notificationCreated()).isTrue();
        assertThat(result.notificationResolved()).isFalse();
    }

    @Test
    void evaluateResolvesNotificationWhenStockIsSafe() {
        Product product = activeProduct(11L, "SP-11", "Sữa hộp");
        when(productRepository.findByIdAndBusinessId(11L, 7L)).thenReturn(Optional.of(product));
        when(configurationRepository.findByConfigKey("inventory.low-stock.7.11"))
                .thenReturn(Optional.of(SystemConfiguration.builder()
                        .configValue(JsonNodeFactory.instance.numberNode(5))
                        .build()));
        when(notificationService.notifyStockRecovered(7L, product, new BigDecimal("8")))
                .thenReturn(true);

        var result = service.evaluate(7L, 11L, new BigDecimal("8"));

        assertThat(result.lowStock()).isFalse();
        assertThat(result.notificationResolved()).isTrue();
    }

    private Product activeProduct(Long id, String code, String name) {
        return Product.builder()
                .id(id)
                .businessId(7L)
                .productCode(code)
                .productName(name)
                .status("ACTIVE")
                .build();
    }
}
