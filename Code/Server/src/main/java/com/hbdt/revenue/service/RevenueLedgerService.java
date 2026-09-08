package com.hbdt.revenue.service;

import com.hbdt.entity.*;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.*;
import com.hbdt.revenue.dto.RevenueLedgerItemResponse;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import com.hbdt.revenue.dto.RevenueLedgerSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RevenueLedgerService {

    private final RevenueLedgerRepository revenueLedgerRepository;
    private final BusinessContextService businessContextService;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;

    public RevenueLedgerService(
            RevenueLedgerRepository revenueLedgerRepository,
            BusinessContextService businessContextService,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository
    ) {
        this.revenueLedgerRepository = revenueLedgerRepository;
        this.businessContextService = businessContextService;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
    }

    @Transactional
    public void recordRevenueForOrder(SalesOrder order, List<SalesOrderItem> items) {
        if (order == null || items == null || items.isEmpty()) {
            return;
        }
        if (!"CONFIRMED".equalsIgnoreCase(order.getStatus())) {
            return;
        }
        if (revenueLedgerRepository.existsByBusinessIdAndSalesOrderIdAndStatus(
                order.getBusinessId(), order.getId(), "ACTIVE")) {
            return;
        }

        String customerName = "Khách lẻ";
        if (order.getCustomerId() != null) {
            customerName = customerRepository.findById(order.getCustomerId())
                    .map(Customer::getCustomerName)
                    .orElse("Khách lẻ");
        }

        LocalDateTime confirmedAt = order.getConfirmedAt() != null
                ? order.getConfirmedAt()
                : (order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now());

        List<RevenueLedgerEntry> entries = new ArrayList<>();
        for (SalesOrderItem item : items) {
            String productName = productRepository.findById(item.getProductId())
                    .map(Product::getProductName)
                    .orElse("Sản phẩm #" + item.getProductId());

            String unitName = unitRepository.findById(item.getUnitId())
                    .map(Unit::getUnitName)
                    .orElse("Đơn vị #" + item.getUnitId());

            RevenueLedgerEntry entry = RevenueLedgerEntry.builder()
                    .businessId(order.getBusinessId())
                    .salesOrderId(order.getId())
                    .salesOrderItemId(item.getId())
                    .orderCode(order.getOrderCode())
                    .confirmedAt(confirmedAt)
                    .customerId(order.getCustomerId())
                    .customerName(customerName)
                    .productId(item.getProductId())
                    .productName(productName)
                    .unitId(item.getUnitId())
                    .unitName(unitName)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .lineTotal(item.getLineTotal())
                    .orderTotalAmount(order.getTotalAmount())
                    .status("ACTIVE")
                    .build();

            entries.add(entry);
        }

        revenueLedgerRepository.saveAll(entries);
    }

    @Transactional
    public void voidRevenueForOrder(Long businessId, Long salesOrderId) {
        if (salesOrderId == null) {
            return;
        }
        revenueLedgerRepository.updateStatusBySalesOrderId(salesOrderId, "CANCELLED", LocalDateTime.now());
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        try {
            List<SalesOrder> allConfirmed = salesOrderRepository.findAllByStatus("CONFIRMED");
            for (SalesOrder order : allConfirmed) {
                if (!revenueLedgerRepository.existsByBusinessIdAndSalesOrderIdAndStatus(
                        order.getBusinessId(), order.getId(), "ACTIVE")) {
                    List<SalesOrderItem> items = salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(order.getId());
                    recordRevenueForOrder(order, items);
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional
    public void syncMissingConfirmedOrders(Long businessId) {
        if (businessId == null) {
            return;
        }
        try {
            List<SalesOrder> confirmedOrders = salesOrderRepository.findAllByBusinessIdAndStatus(businessId, "CONFIRMED");
            for (SalesOrder order : confirmedOrders) {
                if (!revenueLedgerRepository.existsByBusinessIdAndSalesOrderIdAndStatus(
                        order.getBusinessId(), order.getId(), "ACTIVE")) {
                    List<SalesOrderItem> items = salesOrderItemRepository.findAllBySalesOrderIdOrderByIdAsc(order.getId());
                    recordRevenueForOrder(order, items);
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Transactional
    public RevenueLedgerPageResponse search(
            String actorUsername,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword,
            Long productId,
            int page,
            int size
    ) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        syncMissingConfirmedOrders(businessId);

        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;
        String normalizedKeyword = (keyword != null && !keyword.trim().isBlank()) ? keyword.trim() : null;

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageRequest = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "confirmedAt").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Page<RevenueLedgerEntry> entriesPage = revenueLedgerRepository.searchLedger(
                businessId,
                "ACTIVE",
                fromDateTime,
                toDateTime,
                productId,
                normalizedKeyword,
                pageRequest
        );

        RevenueLedgerRepository.RevenueSummaryProjection summaryProj = revenueLedgerRepository.calculateSummary(
                businessId,
                "ACTIVE",
                fromDateTime,
                toDateTime,
                productId,
                normalizedKeyword
        );

        RevenueLedgerSummaryResponse summary = new RevenueLedgerSummaryResponse(
                summaryProj != null && summaryProj.getTotalRevenue() != null ? summaryProj.getTotalRevenue() : BigDecimal.ZERO,
                summaryProj != null && summaryProj.getTotalQuantity() != null ? summaryProj.getTotalQuantity() : BigDecimal.ZERO,
                summaryProj != null && summaryProj.getTotalOrders() != null ? summaryProj.getTotalOrders() : 0L,
                summaryProj != null && summaryProj.getTotalItems() != null ? summaryProj.getTotalItems() : 0L
        );

        Page<RevenueLedgerItemResponse> dtoPage = entriesPage.map(this::toItemResponse);
        return RevenueLedgerPageResponse.of(dtoPage, summary);
    }

    private RevenueLedgerItemResponse toItemResponse(RevenueLedgerEntry entry) {
        return new RevenueLedgerItemResponse(
                entry.getId(),
                entry.getSalesOrderId(),
                entry.getSalesOrderItemId(),
                entry.getOrderCode(),
                entry.getConfirmedAt(),
                entry.getCustomerId(),
                entry.getCustomerName(),
                entry.getProductId(),
                entry.getProductName(),
                entry.getUnitId(),
                entry.getUnitName(),
                entry.getQuantity(),
                entry.getUnitPrice(),
                entry.getLineTotal(),
                entry.getOrderTotalAmount(),
                entry.getStatus()
        );
    }
}
