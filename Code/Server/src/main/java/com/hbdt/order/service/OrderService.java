package com.hbdt.order.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.order.dto.CreateOrderRequest;
import com.hbdt.order.dto.OrderItemRequest;
import com.hbdt.order.dto.OrderItemResponse;
import com.hbdt.order.dto.OrderResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private static final String STATUS_CONFIRMED = "CONFIRMED";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String SOURCE_POS = "POS";

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final BusinessContextService businessContextService;

    public OrderService(SalesOrderRepository salesOrderRepository,
                        SalesOrderItemRepository salesOrderItemRepository,
                        InventoryBalanceRepository inventoryBalanceRepository,
                        InventoryTransactionRepository inventoryTransactionRepository,
                        ProductRepository productRepository,
                        UnitRepository unitRepository,
                        UserRepository userRepository,
                        BusinessContextService businessContextService) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.businessContextService = businessContextService;
    }

    @Transactional
    public OrderResponse createOrder(String username, CreateOrderRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        Long businessId = businessContextService.requireBusinessId(username);

        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Đơn hàng phải chứa ít nhất một sản phẩm");
        }

        // Validate and aggregate item quantities in case of duplicates
        Map<Long, BigDecimal> productQuantityMap = request.items().stream()
                .collect(Collectors.groupingBy(
                        OrderItemRequest::productId,
                        Collectors.reducing(BigDecimal.ZERO, OrderItemRequest::quantity, BigDecimal::add)
                ));

        // 1. Verify products & stock
        for (Map.Entry<Long, BigDecimal> entry : productQuantityMap.entrySet()) {
            Long productId = entry.getKey();
            BigDecimal totalRequestedQty = entry.getValue();

            Product product = productRepository.findByIdAndBusinessId(productId, businessId)
                    .orElseThrow(() -> new BadRequestException("Sản phẩm ID " + productId + " không tồn tại hoặc không thuộc quyền quản lý"));

            if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
                throw new BadRequestException("Sản phẩm '" + product.getProductName() + "' đã bị vô hiệu hóa hoặc ngừng kinh doanh");
            }

            InventoryBalance balance = inventoryBalanceRepository.findByBusinessIdAndProductId(businessId, productId)
                    .orElseGet(() -> InventoryBalance.builder()
                            .businessId(businessId)
                            .productId(productId)
                            .quantityOnHand(BigDecimal.ZERO)
                            .averageUnitCost(BigDecimal.ZERO)
                            .inventoryValue(BigDecimal.ZERO)
                            .build());

            BigDecimal currentStock = balance.getQuantityOnHand() != null ? balance.getQuantityOnHand() : BigDecimal.ZERO;
            if (currentStock.compareTo(totalRequestedQty) < 0) {
                throw new BadRequestException("Sản phẩm '" + product.getProductName() + "' không đủ số lượng tồn kho (Tồn kho hiện có: "
                        + currentStock.stripTrailingZeros().toPlainString() + ", Yêu cầu: "
                        + totalRequestedQty.stripTrailingZeros().toPlainString() + ")");
            }
        }

        // 2. Generate unique order code
        String orderCode = generateOrderCode(businessId);

        // Build note string
        String combinedNote = buildOrderNote(request.customerName(), request.note());

        // 3. Save initial SalesOrder
        SalesOrder salesOrder = SalesOrder.builder()
                .businessId(businessId)
                .createdBy(user.getId())
                .confirmedBy(user.getId())
                .orderCode(orderCode)
                .source(SOURCE_POS)
                .status(STATUS_CONFIRMED)
                .totalAmount(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .debtAmount(BigDecimal.ZERO)
                .note(combinedNote)
                .confirmedAt(LocalDateTime.now())
                .build();

        SalesOrder savedOrder = salesOrderRepository.save(salesOrder);

        // 4. Save items & deduct inventory
        BigDecimal calculatedTotal = BigDecimal.ZERO;
        List<SalesOrderItem> savedItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.items()) {
            Product product = productRepository.findByIdAndBusinessId(itemReq.productId(), businessId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));

            BigDecimal unitPrice = itemReq.unitPrice() != null
                    ? itemReq.unitPrice()
                    : (product.getSalePrice() != null ? product.getSalePrice() : BigDecimal.ZERO);
            BigDecimal lineTotal = unitPrice.multiply(itemReq.quantity());
            calculatedTotal = calculatedTotal.add(lineTotal);

            SalesOrderItem orderItem = SalesOrderItem.builder()
                    .salesOrderId(savedOrder.getId())
                    .productId(product.getId())
                    .unitId(product.getBaseUnitId())
                    .taxActivityGroupId(product.getDefaultTaxActivityGroupId())
                    .quantity(itemReq.quantity())
                    .conversionRate(BigDecimal.ONE)
                    .baseQuantity(itemReq.quantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            savedItems.add(salesOrderItemRepository.save(orderItem));

            // Deduct stock in InventoryBalance
            InventoryBalance balance = inventoryBalanceRepository.findByBusinessIdAndProductId(businessId, product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tồn kho cho sản phẩm"));

            BigDecimal currentStock = balance.getQuantityOnHand() != null ? balance.getQuantityOnHand() : BigDecimal.ZERO;
            BigDecimal newStock = currentStock.subtract(itemReq.quantity());
            BigDecimal avgCost = balance.getAverageUnitCost() != null ? balance.getAverageUnitCost() : BigDecimal.ZERO;

            balance.setQuantityOnHand(newStock);
            balance.setInventoryValue(avgCost.multiply(newStock));
            inventoryBalanceRepository.save(balance);

            // Record InventoryTransaction
            InventoryTransaction tx = InventoryTransaction.builder()
                    .businessId(businessId)
                    .productId(product.getId())
                    .createdBy(user.getId())
                    .transactionType("SALE")
                    .referenceType("SALES_ORDER")
                    .referenceId(savedOrder.getId())
                    .quantityChange(itemReq.quantity().negate())
                    .balanceAfter(newStock)
                    .unitCost(avgCost)
                    .transactionValue(avgCost.multiply(itemReq.quantity()))
                    .balanceValue(avgCost.multiply(newStock))
                    .costStatus("COMPLETED")
                    .note("Bán hàng - Đơn #" + orderCode)
                    .build();

            inventoryTransactionRepository.save(tx);
        }

        savedOrder.setTotalAmount(calculatedTotal);
        savedOrder.setPaidAmount(calculatedTotal);
        savedOrder.setDebtAmount(BigDecimal.ZERO);
        SalesOrder finalOrder = salesOrderRepository.save(savedOrder);

        return toResponse(finalOrder, savedItems, request.customerName());
    }

    @Transactional
    public OrderResponse cancelOrder(String username, Long orderId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản: " + username));
        Long businessId = businessContextService.requireBusinessId(username);

        SalesOrder order = salesOrderRepository.findByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng #" + orderId));

        if (STATUS_CANCELLED.equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Đơn hàng này đã bị hủy trước đó");
        }

        List<SalesOrderItem> items = salesOrderItemRepository.findAllBySalesOrderId(orderId);

        // Restore inventory for each item
        for (SalesOrderItem item : items) {
            InventoryBalance balance = inventoryBalanceRepository.findByBusinessIdAndProductId(businessId, item.getProductId())
                    .orElseGet(() -> InventoryBalance.builder()
                            .businessId(businessId)
                            .productId(item.getProductId())
                            .quantityOnHand(BigDecimal.ZERO)
                            .averageUnitCost(BigDecimal.ZERO)
                            .inventoryValue(BigDecimal.ZERO)
                            .build());

            BigDecimal currentStock = balance.getQuantityOnHand() != null ? balance.getQuantityOnHand() : BigDecimal.ZERO;
            BigDecimal newStock = currentStock.add(item.getBaseQuantity());
            BigDecimal avgCost = balance.getAverageUnitCost() != null ? balance.getAverageUnitCost() : BigDecimal.ZERO;

            balance.setQuantityOnHand(newStock);
            balance.setInventoryValue(avgCost.multiply(newStock));
            inventoryBalanceRepository.save(balance);

            // Record Return Transaction
            InventoryTransaction tx = InventoryTransaction.builder()
                    .businessId(businessId)
                    .productId(item.getProductId())
                    .createdBy(user.getId())
                    .transactionType("CANCEL_SALE")
                    .referenceType("SALES_ORDER")
                    .referenceId(order.getId())
                    .quantityChange(item.getBaseQuantity())
                    .balanceAfter(newStock)
                    .unitCost(avgCost)
                    .transactionValue(avgCost.multiply(item.getBaseQuantity()))
                    .balanceValue(avgCost.multiply(newStock))
                    .costStatus("COMPLETED")
                    .note("Hoàn tồn kho do hủy đơn #" + order.getOrderCode())
                    .build();

            inventoryTransactionRepository.save(tx);
        }

        order.setStatus(STATUS_CANCELLED);
        SalesOrder cancelledOrder = salesOrderRepository.save(order);

        return toResponse(cancelledOrder, items, extractCustomerName(order.getNote()));
    }

    public List<OrderResponse> getRecentOrders(String username, int limit) {
        Long businessId = businessContextService.requireBusinessId(username);
        Page<SalesOrder> page = salesOrderRepository.findAllByBusinessIdOrderByCreatedAtDesc(
                businessId,
                PageRequest.of(0, Math.min(limit, 50), Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return page.getContent().stream()
                .map(order -> {
                    List<SalesOrderItem> items = salesOrderItemRepository.findAllBySalesOrderId(order.getId());
                    return toResponse(order, items, extractCustomerName(order.getNote()));
                })
                .toList();
    }

    private OrderResponse toResponse(SalesOrder order, List<SalesOrderItem> items, String customerName) {
        List<OrderItemResponse> itemResponses = items.stream().map(item -> {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            Unit unit = item.getUnitId() != null ? unitRepository.findById(item.getUnitId()).orElse(null) : null;
            return new OrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    product != null ? product.getProductCode() : "",
                    product != null ? product.getProductName() : "",
                    item.getUnitId(),
                    unit != null ? unit.getUnitName() : "",
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getLineTotal()
            );
        }).toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getSource(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getPaidAmount(),
                order.getDebtAmount(),
                customerName != null ? customerName : extractCustomerName(order.getNote()),
                order.getNote(),
                itemResponses,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private String generateOrderCode(Long businessId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(100, 999);
        String code = "DH" + timestamp + rand;
        while (salesOrderRepository.existsByBusinessIdAndOrderCode(businessId, code)) {
            rand = ThreadLocalRandom.current().nextInt(100, 999);
            code = "DH" + timestamp + rand;
        }
        return code;
    }

    private String buildOrderNote(String customerName, String note) {
        StringBuilder sb = new StringBuilder();
        if (customerName != null && !customerName.isBlank()) {
            sb.append("Khách: ").append(customerName.trim());
        }
        if (note != null && !note.isBlank()) {
            if (sb.length() > 0) sb.append(" | ");
            sb.append(note.trim());
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    private String extractCustomerName(String note) {
        if (note == null || !note.startsWith("Khách: ")) {
            return null;
        }
        int pipeIdx = note.indexOf(" | ");
        if (pipeIdx > 0) {
            return note.substring("Khách: ".length(), pipeIdx).trim();
        }
        return note.substring("Khách: ".length()).trim();
    }
}
