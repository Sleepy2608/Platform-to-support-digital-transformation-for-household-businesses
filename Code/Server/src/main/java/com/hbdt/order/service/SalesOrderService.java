package com.hbdt.order.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.entity.DebtTransaction;
import com.hbdt.entity.enums.PaymentStatus;
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
import com.hbdt.repository.CustomerRepository;
import com.hbdt.repository.DebtTransactionRepository;
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
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SalesOrderService {

    private static final int QUANTITY_SCALE = 3;
    private static final BigDecimal MAX_ORDER_QUANTITY = new BigDecimal("999999999999999.999");

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ProductPricingService productPricingService;
    private final BusinessContextService businessContextService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final InventoryMovementService inventoryMovementService;
    private final CustomerRepository customerRepository;
    private final DebtTransactionRepository debtTransactionRepository;

    public SalesOrderService(
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            ProductPricingService productPricingService,
            BusinessContextService businessContextService,
            UserRepository userRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            InventoryMovementService inventoryMovementService,
            CustomerRepository customerRepository,
            DebtTransactionRepository debtTransactionRepository
    ) {
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.productPricingService = productPricingService;
        this.businessContextService = businessContextService;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.inventoryMovementService = inventoryMovementService;
        this.customerRepository = customerRepository;
        this.debtTransactionRepository = debtTransactionRepository;
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
        BigDecimal debtAmount = totalAmount.subtract(paidAmount);
        BigDecimal customerDebtBefore = BigDecimal.ZERO;
        if (request.customerId() != null) {
            (debtAmount.signum() > 0
                    ? customerRepository.findActiveForUpdate(request.customerId(), businessId)
                    : customerRepository.findByIdAndBusinessIdAndStatus(request.customerId(), businessId, "ACTIVE"))
                    .orElseThrow(() -> new BadRequestException(
                            "Khách hàng không tồn tại, đã ngừng sử dụng hoặc không thuộc hộ kinh doanh"));
            if (debtAmount.signum() > 0) {
                customerDebtBefore = currentCustomerDebt(businessId, request.customerId());
            }
        }
        if (debtAmount.signum() > 0 && request.customerId() == null) {
            throw new BadRequestException("Đơn hàng có công nợ bắt buộc phải chọn khách hàng");
        }

        LocalDateTime confirmedAt = LocalDateTime.now();

        SalesOrder order = salesOrderRepository.save(SalesOrder.builder()
                .businessId(businessId)
                .customerId(request.customerId())
                .createdBy(actor.getId())
                .confirmedBy(actor.getId())
                .orderCode(orderCode)
                .source(request.source() == null || request.source().isBlank()
                        ? "MANUAL" : request.source().toUpperCase())
                .status("CONFIRMED")
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .debtAmount(debtAmount)
                .paymentStatus(determinePaymentStatus(paidAmount, totalAmount))
                .note(request.note())
                .confirmedAt(confirmedAt)
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
        if (debtAmount.signum() > 0) {
            recordDebtTransaction(
                    order, actor.getId(), "DEBT_INCREASE", debtAmount, customerDebtBefore.add(debtAmount),
                    "Phát sinh công nợ từ đơn " + order.getOrderCode(), "DEBT-SO-" + order.getId());
        }
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
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        SalesOrder order = salesOrderRepository.findForUpdateByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (!"CONFIRMED".equals(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể thanh toán đơn hàng đang ở trạng thái đã xác nhận");
        }
        if (order.getCustomerId() == null) {
            throw new BadRequestException("Đơn hàng không gắn với khách hàng công nợ");
        }
        if (paymentAmount == null || paymentAmount.signum() <= 0) {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
        }
        BigDecimal normalizedPayment = paymentAmount.setScale(0, RoundingMode.HALF_UP);
        if (normalizedPayment.signum() <= 0) {
            throw new BadRequestException("Số tiền thanh toán sau khi làm tròn phải lớn hơn 0");
        }
        if (normalizedPayment.compareTo(order.getDebtAmount()) > 0) {
            throw new BadRequestException("Số tiền thanh toán không được vượt quá số còn nợ");
        }
        customerRepository.findActiveForUpdate(order.getCustomerId(), businessId)
                .orElseThrow(() -> new BadRequestException("Khách hàng không còn hoạt động"));
        BigDecimal balanceBefore = currentCustomerDebt(businessId, order.getCustomerId());
        BigDecimal balanceAfter = balanceBefore.subtract(normalizedPayment);
        if (balanceAfter.signum() < 0) {
            throw new BadRequestException("Số tiền thanh toán vượt quá tổng công nợ của khách hàng");
        }

        order.setPaidAmount(order.getPaidAmount().add(normalizedPayment));
        order.setDebtAmount(order.getDebtAmount().subtract(normalizedPayment));
        order.setPaymentStatus(determinePaymentStatus(order.getPaidAmount(), order.getTotalAmount()));
        order.setLastPaymentAt(LocalDateTime.now());
        salesOrderRepository.save(order);
        recordDebtTransaction(
                order, actor.getId(), "PAYMENT", normalizedPayment, balanceAfter,
                "Thanh toán công nợ đơn " + order.getOrderCode(),
                "PAY-SO-" + order.getId() + "-" + shortId());
        return toResponse(order, salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(orderId));
    }

    @Transactional
    public SalesOrderResponse requestCancellation(String actorUsername, Long orderId, String reason) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        SalesOrder order = salesOrderRepository.findForUpdateByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (!"CONFIRMED".equals(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể yêu cầu hủy đơn hàng đã xác nhận");
        }
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Lý do hủy đơn không được để trống");
        }
        order.setStatus("CANCEL_REQUESTED");
        order.setCancelRequestedBy(actor.getId());
        order.setCancelRequestReason(reason.trim());
        order.setCancelRequestedAt(LocalDateTime.now());
        salesOrderRepository.save(order);
        return toResponse(order, salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(orderId));
    }

    @Transactional
    public SalesOrderResponse cancel(String actorUsername, Long orderId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        SalesOrder order = salesOrderRepository.findForUpdateByIdAndBusinessId(orderId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if ("CANCELLED".equals(order.getStatus())) {
            throw new BadRequestException("Đơn hàng đã được hủy trước đó");
        }
        if (!"CONFIRMED".equals(order.getStatus()) && !"CANCEL_REQUESTED".equals(order.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đã xác nhận hoặc đang chờ duyệt hủy");
        }

        List<SalesOrderItem> items = salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(orderId);
        for (SalesOrderItem item : items) {
            inventoryMovementService.restoreCancelledSale(
                    actorUsername, item.getProductId(), item.getBaseQuantity(), orderId, order.getOrderCode());
        }
        if (order.getDebtAmount().signum() > 0 && order.getCustomerId() != null) {
            customerRepository.findActiveForUpdate(order.getCustomerId(), businessId)
                    .orElseThrow(() -> new BadRequestException("Khách hàng không còn hoạt động"));
            BigDecimal balanceAfter = currentCustomerDebt(businessId, order.getCustomerId())
                    .subtract(order.getDebtAmount());
            if (balanceAfter.signum() < 0) {
                throw new BadRequestException("Dữ liệu công nợ không nhất quán, không thể hủy đơn");
            }
            recordDebtTransaction(
                    order, actor.getId(), "VOID", order.getDebtAmount(), balanceAfter,
                    "Đảo công nợ do hủy đơn " + order.getOrderCode(), "REV-SO-" + order.getId());
            order.setDebtAmount(BigDecimal.ZERO.setScale(0));
        }
        order.setStatus("CANCELLED");
        salesOrderRepository.save(order);
        return toResponse(order, items);
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
            validateQuantity(item.quantity());
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

    private void validateQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BadRequestException("Số lượng đặt hàng phải lớn hơn 0");
        }
        if (quantity.stripTrailingZeros().scale() > QUANTITY_SCALE) {
            throw new BadRequestException("Số lượng đặt hàng chỉ được có tối đa 3 chữ số thập phân");
        }
        if (quantity.compareTo(MAX_ORDER_QUANTITY) > 0) {
            throw new BadRequestException("Số lượng đặt hàng không được vượt quá 15 chữ số");
        }
    }

    private SalesOrderResponse toResponse(SalesOrder order, List<SalesOrderItem> items) {
        return new SalesOrderResponse(
                order.getId(), order.getOrderCode(), order.getCustomerId(), order.getSource(),
                order.getStatus(), order.getTotalAmount(), order.getPaidAmount(), order.getDebtAmount(),
                order.getNote(), order.getCancelRequestedBy(), order.getCancelRequestReason(),
                order.getCancelRequestedAt(), order.getCreatedAt(),
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

    private BigDecimal currentCustomerDebt(Long businessId, Long customerId) {
        return debtTransactionRepository.findFirstByBusinessIdAndCustomerIdOrderByIdDesc(businessId, customerId)
                .map(DebtTransaction::getBalanceAfter)
                .orElse(BigDecimal.ZERO)
                .setScale(0, RoundingMode.HALF_UP);
    }

    private void recordDebtTransaction(
            SalesOrder order,
            Long actorId,
            String type,
            BigDecimal amount,
            BigDecimal balanceAfter,
            String description,
            String transactionCode
    ) {
        debtTransactionRepository.save(DebtTransaction.builder()
                .businessId(order.getBusinessId())
                .customerId(order.getCustomerId())
                .salesOrderId(order.getId())
                .createdBy(actorId)
                .transactionCode(transactionCode)
                .transactionType(type)
                .amount(amount.setScale(0, RoundingMode.HALF_UP))
                .balanceAfter(balanceAfter.setScale(0, RoundingMode.HALF_UP))
                .description(description)
                .build());
    }

    private String shortId() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PaymentStatus determinePaymentStatus(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount == null || paidAmount.signum() == 0) {
            return PaymentStatus.UNPAID;
        }
        return paidAmount.compareTo(totalAmount) >= 0
                ? PaymentStatus.PAID
                : PaymentStatus.PARTIALLY_PAID;
    }
}
