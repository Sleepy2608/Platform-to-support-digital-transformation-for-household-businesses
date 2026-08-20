package com.hbdt.order.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.User;
import com.hbdt.order.dto.CreateSalesOrderItemRequest;
import com.hbdt.order.dto.CreateSalesOrderRequest;
import com.hbdt.order.dto.SalesOrderItemResponse;
import com.hbdt.order.dto.SalesOrderResponse;
import com.hbdt.pricing.service.ProductPricingService;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductPricingService productPricingService;
    private final BusinessContextService businessContextService;
    private final UserRepository userRepository;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            ProductPricingService productPricingService,
            BusinessContextService businessContextService,
            UserRepository userRepository
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.productPricingService = productPricingService;
        this.businessContextService = businessContextService;
        this.userRepository = userRepository;
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
        validateUniqueLines(request.items());

        List<SalesOrderItem> pricedItems = request.items().stream()
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
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal paidAmount = request.paidAmount() == null
                ? BigDecimal.ZERO.setScale(2)
                : request.paidAmount().setScale(2, RoundingMode.HALF_UP);
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

    private void validateUniqueLines(List<CreateSalesOrderItemRequest> items) {
        Set<String> keys = new HashSet<>();
        for (CreateSalesOrderItemRequest item : items) {
            if (!keys.add(item.productId() + ":" + item.unitId())) {
                throw new BadRequestException("Sản phẩm và đơn vị tính bị trùng trong đơn hàng");
            }
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
        return new SalesOrderItemResponse(
                item.getId(), item.getProductId(), item.getUnitId(), item.getQuantity(),
                item.getConversionRate(), item.getBaseQuantity(), item.getUnitPrice(),
                item.getLineTotal(), item.getProductPriceId(), item.getPricingRuleName()
        );
    }
}
