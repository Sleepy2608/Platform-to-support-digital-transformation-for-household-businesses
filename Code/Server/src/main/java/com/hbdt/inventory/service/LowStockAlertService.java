package com.hbdt.inventory.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.SystemConfiguration;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.LowStockAlertResponse;
import com.hbdt.inventory.dto.LowStockSummaryResponse;
import com.hbdt.inventory.dto.StockThresholdResponse;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SystemConfigurationRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LowStockAlertService {

    private static final String ACTIVE = "ACTIVE";
    private static final String CONFIG_PREFIX = "inventory.low-stock.";

    private final BusinessContextService businessContextService;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final SystemConfigurationRepository configurationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public LowStockAlertService(
            BusinessContextService businessContextService,
            ProductRepository productRepository,
            InventoryBalanceRepository balanceRepository,
            SystemConfigurationRepository configurationRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.businessContextService = businessContextService;
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.configurationRepository = configurationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public StockThresholdResponse configureThreshold(
            String username, Long productId, BigDecimal minimumStock) {
        validateThreshold(minimumStock);
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = requireActiveProduct(businessId, productId);
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        String configKey = thresholdKey(businessId, productId);
        SystemConfiguration configuration = configurationRepository.findByConfigKey(configKey)
                .orElseGet(() -> SystemConfiguration.builder()
                        .configKey(configKey)
                        .dataType("NUMBER")
                        .description("Ngưỡng tồn kho tối thiểu cho sản phẩm " + product.getProductCode())
                        .publicConfig(false)
                        .build());
        configuration.setUpdatedBy(actor.getId());
        configuration.setConfigValue(JsonNodeFactory.instance.numberNode(minimumStock));
        configurationRepository.save(configuration);

        BigDecimal quantity = currentQuantity(businessId, productId);
        evaluate(businessId, product, quantity, Optional.of(minimumStock));
        return toThresholdResponse(product, quantity, Optional.of(minimumStock));
    }

    @Transactional(readOnly = true)
    public List<StockThresholdResponse> getThresholds(String username) {
        Long businessId = businessContextService.requireBusinessId(username);
        Map<Long, BigDecimal> thresholds = thresholdMap(businessId);
        return productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(
                        businessId, ACTIVE).stream()
                .map(product -> toThresholdResponse(
                        product,
                        currentQuantity(businessId, product.getId()),
                        Optional.ofNullable(thresholds.get(product.getId()))))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LowStockAlertResponse> getAlerts(String username) {
        Long businessId = businessContextService.requireBusinessId(username);
        Map<Long, BigDecimal> thresholds = thresholdMap(businessId);
        return productRepository.findAllByBusinessIdAndStatusOrderByProductNameAsc(
                        businessId, ACTIVE).stream()
                .map(product -> toAlertResponse(
                        businessId, product, thresholds.get(product.getId())))
                .flatMap(Optional::stream)
                .sorted(Comparator.comparing(LowStockAlertResponse::quantityOnHand)
                        .thenComparing(LowStockAlertResponse::productName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LowStockAlertResponse> getAlerts(String username, boolean includeResolved) {
        return getAlerts(username);
    }

    @Transactional(readOnly = true)
    public LowStockSummaryResponse getSummary(String username, int limit) {
        List<LowStockAlertResponse> active = getAlerts(username);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return new LowStockSummaryResponse(active.size(), active.stream().limit(safeLimit).toList());
    }

    @Transactional
    public EvaluationResult evaluate(Long businessId, Long productId, BigDecimal quantity) {
        Product product = requireProduct(businessId, productId);
        return evaluate(businessId, product, quantity, findThreshold(businessId, productId));
    }

    @Transactional
    public EvaluationResult synchronizeProductStatus(Long businessId, Long productId) {
        Product product = requireProduct(businessId, productId);
        return evaluate(
                businessId,
                product,
                currentQuantity(businessId, productId),
                findThreshold(businessId, productId));
    }

    private EvaluationResult evaluate(
            Long businessId,
            Product product,
            BigDecimal quantity,
            Optional<BigDecimal> threshold
    ) {
        boolean active = ACTIVE.equalsIgnoreCase(product.getStatus());
        boolean lowStock = active
                && threshold.isPresent()
                && quantity.compareTo(threshold.get()) < 0;

        if (lowStock) {
            boolean created = notificationService.notifyLowStock(
                    businessId, product, quantity, threshold.orElseThrow());
            return new EvaluationResult(true, created, false);
        }

        boolean resolved = notificationService.notifyStockRecovered(businessId, product, quantity);
        return new EvaluationResult(false, false, resolved);
    }

    private void validateThreshold(BigDecimal minimumStock) {
        if (minimumStock == null || minimumStock.signum() < 0) {
            throw new BadRequestException("Ngưỡng tồn kho tối thiểu không được âm");
        }
        if (minimumStock.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException("Ngưỡng tồn kho tối thiểu phải là số nguyên");
        }
    }

    private Product requireProduct(Long businessId, Long productId) {
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private Product requireActiveProduct(Long businessId, Long productId) {
        Product product = requireProduct(businessId, productId);
        if (!ACTIVE.equalsIgnoreCase(product.getStatus())) {
            throw new BadRequestException("Không thể cấu hình cảnh báo cho sản phẩm ngừng sử dụng");
        }
        return product;
    }

    private BigDecimal currentQuantity(Long businessId, Long productId) {
        return balanceRepository.findByBusinessIdAndProductId(businessId, productId)
                .map(InventoryBalance::getQuantityOnHand)
                .orElse(BigDecimal.ZERO);
    }

    private Optional<BigDecimal> findThreshold(Long businessId, Long productId) {
        return configurationRepository.findByConfigKey(thresholdKey(businessId, productId))
                .flatMap(this::numericValue);
    }

    private Map<Long, BigDecimal> thresholdMap(Long businessId) {
        String prefix = businessPrefix(businessId);
        Map<Long, BigDecimal> thresholds = new HashMap<>();
        for (SystemConfiguration configuration
                : configurationRepository.findAllByConfigKeyStartingWith(prefix)) {
            try {
                Long productId = Long.valueOf(configuration.getConfigKey().substring(prefix.length()));
                numericValue(configuration).ifPresent(value -> thresholds.put(productId, value));
            } catch (NumberFormatException ignored) {
                // Ignore unrelated or malformed configuration keys without breaking the dashboard.
            }
        }
        return thresholds;
    }

    private Optional<BigDecimal> numericValue(SystemConfiguration configuration) {
        JsonNode value = configuration.getConfigValue();
        if (value == null || !value.isNumber()) {
            return Optional.empty();
        }
        BigDecimal threshold = value.decimalValue();
        return threshold.signum() < 0 ? Optional.empty() : Optional.of(threshold);
    }

    private String businessPrefix(Long businessId) {
        return CONFIG_PREFIX + businessId + ".";
    }

    private String thresholdKey(Long businessId, Long productId) {
        return businessPrefix(businessId) + productId;
    }

    private StockThresholdResponse toThresholdResponse(
            Product product,
            BigDecimal quantity,
            Optional<BigDecimal> threshold
    ) {
        BigDecimal minimumStock = threshold.orElse(null);
        return new StockThresholdResponse(
                product.getId(),
                product.getProductCode(),
                product.getProductName(),
                quantity,
                minimumStock,
                threshold.isPresent(),
                threshold.isPresent() && quantity.compareTo(threshold.orElseThrow()) < 0);
    }

    private Optional<LowStockAlertResponse> toAlertResponse(
            Long businessId,
            Product product,
            BigDecimal threshold
    ) {
        if (threshold == null) {
            return Optional.empty();
        }
        BigDecimal quantity = currentQuantity(businessId, product.getId());
        if (quantity.compareTo(threshold) >= 0) {
            return Optional.empty();
        }
        return Optional.of(new LowStockAlertResponse(
                product.getId(),
                product.getId(),
                product.getProductCode(),
                product.getProductName(),
                quantity,
                threshold,
                ACTIVE,
                true,
                null,
                null,
                null));
    }

    public record EvaluationResult(
            boolean lowStock,
            boolean notificationCreated,
            boolean notificationResolved
    ) {
    }
}
