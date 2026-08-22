package com.hbdt.order.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.service.InventoryMovementService;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderItemResponse;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.order.dto.SalesOrderPageResponse;
import com.hbdt.order.dto.SalesOrderSummaryResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SalesOrderService {

    private static final BigDecimal MAX_ORDER_QUANTITY = new BigDecimal("999999999999999");

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductPricingService productPricingService;
    private final BusinessContextService businessContextService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final InventoryMovementService inventoryMovementService;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            ProductPricingService productPricingService,
            BusinessContextService businessContextService,
            UserRepository userRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            InventoryMovementService inventoryMovementService
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.productPricingService = productPricingService;
        this.businessContextService = businessContextService;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.inventoryMovementService = inventoryMovementService;
    }

    @Transactional
    public SalesOrderResponse create(String actorUsername, CreateSalesOrderRequest request) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        String orderCode = request.orderCode().trim();
        if (salesOrderRepository.existsByBusinessIdAndOrderCodeIgnoreCase(businessId, orderCode)) {
            throw new BadRequestException("Mã đơn hàng đã tồn tại");
        }
        List<CreateSalesOrderItemRequest> mergedItems = mergeDuplicateLines(request.items());

        List<SalesOrderItem> pricedItems = mergedItems.stream()
                .map(item -> productPricingService.snapshotOrderItemPrice(
                        actorUsername,
                        SalesOrderItem.builder()
                                .productId(item.productId())
                                .unitId(item.unitId())
                                .taxActivityGroupId(item.taxActivityGroupId())
                                .quantity(item.quantity())
                                .build()
                ))
                .toList();
        BigDecimal totalAmount = pricedItems.stream()
                .map(SalesOrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal paidAmount = request.paidAmount() == null
                ? BigDecimal.ZERO
                : request.paidAmount().setScale(0, RoundingMode.HALF_UP);
        if (paidAmount.compareTo(totalAmount) > 0) {
            throw new BadRequestException("Số tiền đã trả không được lớn hơn tổng tiền đơn hàng");
        }

        SalesOrder order = salesOrderRepository.save(SalesOrder.builder()
                .businessId(businessId)
                .customerId(request.customerId())
                .createdBy(actor.getId())
                .orderCode(orderCode)
                .source(request.source() == null || request.source().isBlank()
                        ? "MANUAL" : request.source().toUpperCase())
                .status("DRAFT")
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .debtAmount(totalAmount.subtract(paidAmount))
                .note(request.note())
                .build());
        for (SalesOrderItem item : pricedItems) {
            item.setSalesOrderId(order.getId());
            inventoryMovementService.stockOut(actorUsername, new InventoryMovementRequest(
                    item.getProductId(),
                    item.getUnitId(),
                    item.getQuantity(),
                    null,
                    order.getId(),
                    "Xuất kho cho đơn hàng " + order.getOrderCode()
            ));
        }
        List<SalesOrderItem> savedItems = salesOrderItemRepository.saveAll(pricedItems);
        return toResponse(order, savedItems);
    }

    @Transactional(readOnly = true)
    public SalesOrderResponse get(String actorUsername, Long orderId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        return toResponse(order, salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(orderId));
    }

    @Transactional
    public SalesOrderResponse makePayment(String actorUsername, Long orderId, BigDecimal paymentAmount) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if ("CANCELLED".equals(order.getStatus())) {
            throw new BadRequestException("Không thể thanh toán đơn hàng đã hủy");
        }
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
        }
        BigDecimal newPaid = order.getPaidAmount().add(paymentAmount).setScale(0, RoundingMode.HALF_UP);
        if (newPaid.compareTo(order.getTotalAmount()) > 0) {
            throw new BadRequestException("Tổng tiền đã trả không được vượt quá tổng tiền đơn hàng ("
                    + order.getTotalAmount().toPlainString() + " ₫)");
        }
        BigDecimal newDebt = order.getTotalAmount().subtract(newPaid).setScale(0, RoundingMode.HALF_UP);
        order.setPaidAmount(newPaid);
        order.setDebtAmount(newDebt);
        if (newDebt.compareTo(BigDecimal.ZERO) == 0) {
            order.setStatus("CONFIRMED");
        }
        salesOrderRepository.save(order);
        return toResponse(order, salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(orderId));
    }

    @Transactional(readOnly = true)
    public SalesOrderPageResponse search(
            String actorUsername,
            String keyword,
            String status,
            String source,
            int page,
            int size
    ) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<SalesOrderSummaryResponse> result = salesOrderRepository.searchByBusiness(
                businessId,
                normalizeFilter(keyword, false),
                normalizeFilter(status, true),
                normalizeFilter(source, true),
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).map(this::toSummaryResponse);
        return SalesOrderPageResponse.from(result);
    }

    private List<CreateSalesOrderItemRequest> mergeDuplicateLines(List<CreateSalesOrderItemRequest> items) {
        Map<String, CreateSalesOrderItemRequest> merged = new LinkedHashMap<>();
        for (CreateSalesOrderItemRequest item : items) {
            validateIntegerQuantity(item.quantity());
            String key = item.productId() + ":" + item.unitId();
            merged.merge(key, item, (current, duplicate) -> new CreateSalesOrderItemRequest(
                    current.productId(),
                    current.unitId(),
                    current.quantity().add(duplicate.quantity()),
                    current.taxActivityGroupId() != null
                            ? current.taxActivityGroupId()
                            : duplicate.taxActivityGroupId()
            ));
        }
        return List.copyOf(merged.values());
    }

    private void validateIntegerQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("Số lượng đặt hàng phải lớn hơn 0");
        }
        if (quantity.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException("Số lượng đặt hàng phải là số nguyên");
        }
        if (quantity.compareTo(MAX_ORDER_QUANTITY) > 0) {
            throw new BadRequestException("Số lượng đặt hàng không được vượt quá 15 chữ số");
        }
    }

    private SalesOrderResponse toResponse(SalesOrder order, List<SalesOrderItem> items) {
        return new SalesOrderResponse(
                order.getId(), order.getOrderCode(), order.getCustomerId(), order.getSource(),
                order.getStatus(), order.getTotalAmount(), order.getPaidAmount(), order.getDebtAmount(),
                order.getNote(), order.getCreatedAt(),
                items.stream().map(this::toItemResponse).toList()
        );
    }

    private SalesOrderItemResponse toItemResponse(SalesOrderItem item) {
        Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong đơn hàng"));
        Unit unit = unitRepository.findById(item.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính trong đơn hàng"));
        return new SalesOrderItemResponse(
                item.getId(), item.getProductId(), product.getProductName(),
                item.getUnitId(), unit.getUnitName(), item.getQuantity(),
                item.getConversionRate(), item.getBaseQuantity(), item.getUnitPrice(),
                item.getLineTotal(), item.getProductPriceId(), item.getPricingRuleName()
        );
    }

    private SalesOrderSummaryResponse toSummaryResponse(SalesOrder order) {
        return new SalesOrderSummaryResponse(
                order.getId(), order.getOrderCode(), order.getSource(), order.getStatus(),
                order.getTotalAmount(), order.getPaidAmount(), order.getDebtAmount(), order.getCreatedAt()
        );
    }

    private String normalizeFilter(String value, boolean uppercase) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        return uppercase ? normalized.toUpperCase() : normalized;
    }
}
