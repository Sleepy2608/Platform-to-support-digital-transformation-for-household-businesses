package com.hbdt.inventory.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryAlert;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.enums.InventoryAlertStatus;
import com.hbdt.inventory.dto.LowStockAlertResponse;
import com.hbdt.inventory.dto.LowStockSummaryResponse;
import com.hbdt.inventory.dto.StockThresholdResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.repository.InventoryAlertRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LowStockAlertService {

    private final BusinessContextService businessContextService;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryAlertRepository alertRepository;
    private final NotificationService notificationService;

    public LowStockAlertService(
            BusinessContextService businessContextService,
            ProductRepository productRepository,
            InventoryBalanceRepository balanceRepository,
            InventoryAlertRepository alertRepository,
            NotificationService notificationService
    ) {
        this.businessContextService = businessContextService;
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.alertRepository = alertRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public StockThresholdResponse configureThreshold(
            String username, Long productId, BigDecimal minimumStock) {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = requireProduct(businessId, productId);
        product.setMinimumStock(minimumStock);
        productRepository.save(product);

        BigDecimal quantity = currentQuantity(businessId, productId);
        evaluate(businessId, product, quantity);
        return toThresholdResponse(product, quantity);
    }

    @Transactional(readOnly = true)
    public List<StockThresholdResponse> getThresholds(String username) {
        Long businessId = businessContextService.requireBusinessId(username);
        return productRepository.findAllByBusinessIdOrderByProductNameAsc(businessId).stream()
                .map(product -> toThresholdResponse(
                        product, currentQuantity(businessId, product.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LowStockAlertResponse> getAlerts(String username, boolean includeResolved) {
        Long businessId = businessContextService.requireBusinessId(username);
        List<InventoryAlert> alerts = includeResolved
                ? alertRepository.findAllByBusinessIdOrderByTriggeredAtDesc(businessId)
                : alertRepository.findAllByBusinessIdAndStatusOrderByLastDetectedAtDesc(
                        businessId, InventoryAlertStatus.ACTIVE);
        return alerts.stream().map(this::toAlertResponse).toList();
    }

    @Transactional(readOnly = true)
    public LowStockSummaryResponse getSummary(String username, int limit) {
        List<LowStockAlertResponse> active = getAlerts(username, false);
        int safeLimit = Math.min(Math.max(limit, 1), 100);
        return new LowStockSummaryResponse(active.size(), active.stream().limit(safeLimit).toList());
    }

    @Transactional
    public EvaluationResult evaluate(Long businessId, Long productId, BigDecimal quantity) {
        return evaluate(businessId, requireProduct(businessId, productId), quantity);
    }

    private EvaluationResult evaluate(Long businessId, Product product, BigDecimal quantity) {
        BigDecimal threshold = product.getMinimumStock();
        List<InventoryAlert> activeAlerts = alertRepository.findActiveForUpdate(
                businessId, product.getId());
        LocalDateTime now = LocalDateTime.now();
        boolean lowStock = threshold != null && quantity.compareTo(threshold) < 0;

        if (lowStock) {
            InventoryAlert alert;
            boolean created;
            if (activeAlerts.isEmpty()) {
                alert = InventoryAlert.builder()
                        .businessId(businessId)
                        .productId(product.getId())
                        .status(InventoryAlertStatus.ACTIVE)
                        .quantitySnapshot(quantity)
                        .thresholdSnapshot(threshold)
                        .triggeredAt(now)
                        .lastDetectedAt(now)
                        .build();
                created = true;
            } else {
                alert = activeAlerts.get(0);
                alert.setQuantitySnapshot(quantity);
                alert.setThresholdSnapshot(threshold);
                alert.setLastDetectedAt(now);
                created = false;
                activeAlerts.stream().skip(1).forEach(duplicate -> resolve(duplicate, now));
            }
            alertRepository.save(alert);
            if (created) {
                notificationService.notifyLowStock(businessId, product, quantity, threshold);
            }
            return new EvaluationResult(alert, created, false);
        }

        activeAlerts.forEach(alert -> resolve(alert, now));
        boolean resolved = !activeAlerts.isEmpty();
        if (resolved) {
            notificationService.notifyStockRecovered(businessId, product, quantity);
        }
        return new EvaluationResult(resolved ? activeAlerts.get(0) : null, false, resolved);
    }

    private void resolve(InventoryAlert alert, LocalDateTime resolvedAt) {
        alert.setStatus(InventoryAlertStatus.RESOLVED);
        alert.setResolvedAt(resolvedAt);
        alertRepository.save(alert);
    }

    private Product requireProduct(Long businessId, Long productId) {
        return productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
    }

    private BigDecimal currentQuantity(Long businessId, Long productId) {
        return balanceRepository.findByBusinessIdAndProductId(businessId, productId)
                .map(InventoryBalance::getQuantityOnHand)
                .orElse(BigDecimal.ZERO);
    }

    private StockThresholdResponse toThresholdResponse(Product product, BigDecimal quantity) {
        BigDecimal threshold = product.getMinimumStock();
        return new StockThresholdResponse(
                product.getId(), product.getProductCode(), product.getProductName(), quantity,
                threshold, threshold != null, threshold != null && quantity.compareTo(threshold) < 0);
    }

    private LowStockAlertResponse toAlertResponse(InventoryAlert alert) {
        Product product = requireProduct(alert.getBusinessId(), alert.getProductId());
        BigDecimal quantity = currentQuantity(alert.getBusinessId(), alert.getProductId());
        BigDecimal threshold = product.getMinimumStock() == null
                ? alert.getThresholdSnapshot() : product.getMinimumStock();
        return new LowStockAlertResponse(
                alert.getId(), product.getId(), product.getProductCode(), product.getProductName(),
                quantity, threshold, alert.getStatus().name(),
                alert.getStatus() == InventoryAlertStatus.ACTIVE && quantity.compareTo(threshold) < 0,
                alert.getTriggeredAt(), alert.getLastDetectedAt(), alert.getResolvedAt());
    }

    public record EvaluationResult(InventoryAlert alert, boolean created, boolean resolved) {
    }
}
