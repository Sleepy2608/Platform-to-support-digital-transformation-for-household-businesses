package com.hbdt.revenue.service;

import com.hbdt.entity.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.*;
import com.hbdt.revenue.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RevenueLedgerService {

    private final RevenueLedgerRepository revenueLedgerRepository;
    private final BusinessContextService businessContextService;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final StockImportRepository stockImportRepository;
    private final UserRepository userRepository;
    private final DebtTransactionRepository debtTransactionRepository;
    private final AccountingReportReviewRepository accountingReportReviewRepository;

    public RevenueLedgerService(
            RevenueLedgerRepository revenueLedgerRepository,
            BusinessContextService businessContextService,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            SalesOrderRepository salesOrderRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            StockImportRepository stockImportRepository,
            UserRepository userRepository,
            DebtTransactionRepository debtTransactionRepository,
            AccountingReportReviewRepository accountingReportReviewRepository
    ) {
        this.revenueLedgerRepository = revenueLedgerRepository;
        this.businessContextService = businessContextService;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.stockImportRepository = stockImportRepository;
        this.userRepository = userRepository;
        this.debtTransactionRepository = debtTransactionRepository;
        this.accountingReportReviewRepository = accountingReportReviewRepository;
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
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Từ ngày không được sau đến ngày");
        }
        syncMissingConfirmedOrders(businessId);

        LocalDateTime fromDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;
        String normalizedKeyword = (keyword != null && !keyword.trim().isBlank()) ? keyword.trim() : null;

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest ledgerPageRequest = PageRequest.of(
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
                ledgerPageRequest
        );

        RevenueLedgerRepository.RevenueSummaryProjection summaryProj = revenueLedgerRepository.calculateSummary(
                businessId,
                "ACTIVE",
                fromDateTime,
                toDateTime,
                productId,
                normalizedKeyword
        );

        RevenueLedgerRepository.OrderPaymentSummaryProjection paymentProj = revenueLedgerRepository.calculateOrderPaymentSummary(
                businessId,
                "ACTIVE",
                fromDateTime,
                toDateTime,
                productId,
                normalizedKeyword
        );

        BigDecimal totalRevenue = summaryProj != null && summaryProj.getTotalRevenue() != null ? summaryProj.getTotalRevenue() : BigDecimal.ZERO;
        BigDecimal totalPaid = paymentProj != null && paymentProj.getTotalPaid() != null ? paymentProj.getTotalPaid() : BigDecimal.ZERO;
        BigDecimal totalDebt = totalRevenue.subtract(totalPaid);
        if (totalDebt.compareTo(BigDecimal.ZERO) < 0) {
            totalDebt = BigDecimal.ZERO;
        }

        BigDecimal totalQuantity = summaryProj != null && summaryProj.getTotalQuantity() != null ? summaryProj.getTotalQuantity() : BigDecimal.ZERO;
        Long totalOrders = summaryProj != null && summaryProj.getTotalOrders() != null ? summaryProj.getTotalOrders() : 0L;
        Long totalItems = summaryProj != null && summaryProj.getTotalItems() != null ? summaryProj.getTotalItems() : 0L;

        BigDecimal totalImportCost = stockImportRepository.calculateTotalImportCost(businessId, fromDateTime, toDateTime);
        if (totalImportCost == null) {
            totalImportCost = BigDecimal.ZERO;
        }

        BigDecimal expectedProfit = totalRevenue.subtract(totalImportCost);
        BigDecimal actualProfit = totalPaid.subtract(totalImportCost);

        RevenueLedgerSummaryResponse summary = new RevenueLedgerSummaryResponse(
                totalRevenue,
                totalPaid,
                totalDebt,
                totalImportCost,
                expectedProfit,
                actualProfit,
                totalQuantity,
                totalOrders,
                totalItems
        );

        PageRequest importPageRequest = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "importDate").and(Sort.by(Sort.Direction.DESC, "id"))
        );

        Page<StockImport> importPage = stockImportRepository.searchConfirmedStockImports(
                businessId,
                fromDateTime,
                toDateTime,
                normalizedKeyword,
                importPageRequest
        );

        List<com.hbdt.revenue.dto.StockImportLedgerItemResponse> stockImports = importPage.getContent().stream()
                .map(si -> new com.hbdt.revenue.dto.StockImportLedgerItemResponse(
                        si.getId(),
                        si.getImportCode(),
                        si.getImportDate(),
                        si.getTotalAmount(),
                        userRepository.findById(si.getCreatedBy()).map(User::getFullName).orElse("—"),
                        si.getStatus(),
                        si.getNote()
                ))
                .toList();

        DebtReport debtReport = buildDebtReport(
                businessId, fromDateTime, toDateTime, normalizedKeyword);
        Long confirmedStockImports = stockImportRepository.countConfirmedInPeriod(
                businessId, fromDateTime, toDateTime);
        // Use the paid amount of the exact orders selected by the current filters.
        // Rebuilding cash from the customer debt ledger can mix transactions from
        // another date/product scope and therefore disagree with the sales summary.
        BigDecimal cashCollected = totalPaid;
        String dataSignature = reportSignature(
                totalRevenue, cashCollected, debtReport.summary().debtIncurred(),
                debtReport.summary().amountCollected(), debtReport.summary().closingBalance(),
                totalImportCost, totalOrders, confirmedStockImports);
        AccountingReportReview review = accountingReportReviewRepository
                .findFirstByBusinessIdAndPeriodFromAndPeriodToAndDataSignatureOrderByReviewedAtDescIdDesc(
                        businessId, fromDate, toDate, dataSignature)
                .orElse(null);
        BusinessOperationsReportResponse operations = new BusinessOperationsReportResponse(
                fromDate,
                toDate,
                totalRevenue,
                cashCollected,
                debtReport.summary().debtIncurred(),
                debtReport.summary().amountCollected(),
                debtReport.summary().closingBalance(),
                totalImportCost,
                cashCollected.subtract(totalImportCost),
                totalOrders,
                confirmedStockImports == null ? 0L : confirmedStockImports,
                "Báo cáo quản trị hoạt động kinh doanh",
                review == null ? "DRAFT" : review.getStatus(),
                review == null ? null : review.getReviewNote(),
                review == null ? null : userRepository.findById(review.getReviewedBy())
                        .map(User::getFullName).orElse("—"),
                review == null ? null : review.getReviewedAt(),
                dataSignature
        );

        List<Long> orderIds = entriesPage.getContent().stream()
                .map(RevenueLedgerEntry::getSalesOrderId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, SalesOrder> orderMap = orderIds.isEmpty()
                ? Collections.emptyMap()
                : salesOrderRepository.findAllById(orderIds).stream()
                        .collect(Collectors.toMap(SalesOrder::getId, Function.identity(), (a, b) -> a));

        Page<RevenueLedgerItemResponse> dtoPage = entriesPage.map(entry -> toItemResponse(entry, orderMap.get(entry.getSalesOrderId())));
        return RevenueLedgerPageResponse.of(
                dtoPage,
                stockImports,
                debtReport.items(),
                debtReport.summary(),
                operations,
                "TT88/2021/TT-BTC - S1-HKD; báo cáo công nợ và hoạt động là báo cáo quản trị",
                summary);
    }

    @Transactional
    public BusinessOperationsReportResponse reviewReport(
            String actorUsername,
            LocalDate fromDate,
            LocalDate toDate,
            String requestedStatus,
            String note
    ) {
        String status = requestedStatus == null
                ? ""
                : requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "REJECTED").contains(status)) {
            throw new BadRequestException("Trạng thái kiểm tra phải là APPROVED hoặc REJECTED");
        }
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Từ ngày không được sau đến ngày");
        }
        String normalizedNote = note == null || note.isBlank() ? null : note.trim();
        if ("REJECTED".equals(status) && normalizedNote == null) {
            throw new BadRequestException("Cần nhập lý do yêu cầu chỉnh sửa báo cáo");
        }

        Long businessId = businessContextService.requireBusinessId(actorUsername);
        User reviewer = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        BusinessOperationsReportResponse current = search(
                actorUsername, fromDate, toDate, null, null, 0, 1).operations();
        accountingReportReviewRepository.save(AccountingReportReview.builder()
                .businessId(businessId)
                .periodFrom(fromDate)
                .periodTo(toDate)
                .status(status)
                .reviewNote(normalizedNote)
                .reviewedBy(reviewer.getId())
                .reviewedAt(LocalDateTime.now())
                .dataSignature(current.dataSignature())
                .build());

        return new BusinessOperationsReportResponse(
                current.fromDate(), current.toDate(), current.salesRevenue(), current.cashCollected(),
                current.debtIncurred(), current.debtCollected(), current.closingReceivables(),
                current.stockPurchaseValue(), current.netOperatingCashFlow(), current.confirmedOrders(),
                current.confirmedStockImports(), current.reportType(), status, normalizedNote,
                reviewer.getFullName(), LocalDateTime.now(), current.dataSignature());
    }

    private String reportSignature(Object... values) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(Arrays.toString(values).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private DebtReport buildDebtReport(
            Long businessId,
            LocalDateTime fromDateTime,
            LocalDateTime toDateTime,
            String keyword
    ) {
        List<DebtTransaction> transactions = debtTransactionRepository
                .findForAccountingReport(businessId, toDateTime);
        List<Long> customerIds = transactions.stream()
                .map(DebtTransaction::getCustomerId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Customer> customers = customerIds.isEmpty()
                ? Collections.emptyMap()
                : customerRepository.findAllById(customerIds).stream()
                        .filter(customer -> Objects.equals(customer.getBusinessId(), businessId))
                        .collect(Collectors.toMap(Customer::getId, Function.identity(), (left, right) -> left));

        Map<Long, DebtAccumulator> grouped = new LinkedHashMap<>();
        for (DebtTransaction transaction : transactions) {
            if (transaction.getCustomerId() == null || transaction.getAmount() == null) {
                continue;
            }
            DebtAccumulator accumulator = grouped.computeIfAbsent(
                    transaction.getCustomerId(), ignored -> new DebtAccumulator());
            boolean beforePeriod = fromDateTime != null
                    && transaction.getTransactionDate().isBefore(fromDateTime);
            if (beforePeriod) {
                accumulator.openingBalance = accumulator.openingBalance
                        .add(signedDebtEffect(transaction));
                accumulator.closingBalance = accumulator.closingBalance
                        .add(signedDebtEffect(transaction));
                continue;
            }

            BigDecimal amount = transaction.getAmount();
            switch (transaction.getTransactionType()) {
                case "DEBT_INCREASE" -> accumulator.debtIncurred = accumulator.debtIncurred.add(amount);
                case "PAYMENT", "DEBT_PAYMENT" ->
                        accumulator.amountCollected = accumulator.amountCollected.add(amount);
                case "VOID", "DEBT_REVERSAL" ->
                        accumulator.adjustments = accumulator.adjustments.subtract(amount);
                case "ADJUSTMENT" -> accumulator.adjustments = accumulator.adjustments.add(amount);
                default -> { }
            }
            accumulator.closingBalance = accumulator.closingBalance.add(signedDebtEffect(transaction));
            accumulator.lastTransactionAt = transaction.getTransactionDate();
        }

        String normalizedKeyword = keyword == null ? null : keyword.toLowerCase(Locale.ROOT);
        List<DebtReportItemResponse> items = grouped.entrySet().stream()
                .map(entry -> {
                    Customer customer = customers.get(entry.getKey());
                    DebtAccumulator value = entry.getValue();
                    return new DebtReportItemResponse(
                            entry.getKey(),
                            customer == null ? "—" : customer.getCustomerCode(),
                            customer == null ? "Khách hàng #" + entry.getKey() : customer.getCustomerName(),
                            value.openingBalance,
                            value.debtIncurred,
                            value.amountCollected,
                            value.adjustments,
                            value.closingBalance,
                            value.lastTransactionAt);
                })
                .filter(item -> normalizedKeyword == null
                        || item.customerName().toLowerCase(Locale.ROOT).contains(normalizedKeyword)
                        || item.customerCode().toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .sorted(Comparator.comparing(DebtReportItemResponse::closingBalance).reversed()
                        .thenComparing(DebtReportItemResponse::customerName))
                .toList();

        BigDecimal opening = items.stream().map(DebtReportItemResponse::openingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal incurred = items.stream().map(DebtReportItemResponse::debtIncurred)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal collected = items.stream().map(DebtReportItemResponse::amountCollected)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal adjustments = items.stream().map(DebtReportItemResponse::adjustments)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal closing = items.stream().map(DebtReportItemResponse::closingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long customersWithDebt = items.stream()
                .filter(item -> item.closingBalance().signum() > 0)
                .count();
        return new DebtReport(items, new DebtReportSummaryResponse(
                opening, incurred, collected, adjustments, closing, customersWithDebt));
    }

    private BigDecimal signedDebtEffect(DebtTransaction transaction) {
        return switch (transaction.getTransactionType()) {
            case "DEBT_INCREASE", "ADJUSTMENT" -> transaction.getAmount();
            case "PAYMENT", "DEBT_PAYMENT", "VOID", "DEBT_REVERSAL" ->
                    transaction.getAmount().negate();
            default -> BigDecimal.ZERO;
        };
    }

    private record DebtReport(List<DebtReportItemResponse> items, DebtReportSummaryResponse summary) {
    }

    private static class DebtAccumulator {
        private BigDecimal openingBalance = BigDecimal.ZERO;
        private BigDecimal debtIncurred = BigDecimal.ZERO;
        private BigDecimal amountCollected = BigDecimal.ZERO;
        private BigDecimal adjustments = BigDecimal.ZERO;
        private BigDecimal closingBalance = BigDecimal.ZERO;
        private LocalDateTime lastTransactionAt;
    }

    private RevenueLedgerItemResponse toItemResponse(RevenueLedgerEntry entry, SalesOrder order) {
        BigDecimal paidAmount = order != null && order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal debtAmount = order != null && order.getDebtAmount() != null ? order.getDebtAmount() : BigDecimal.ZERO;
        String paymentStatus = order != null && order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "UNPAID";

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
                paidAmount,
                debtAmount,
                paymentStatus,
                entry.getStatus()
        );
    }
}
