package com.hbdt.accounting.service;

import com.hbdt.accounting.dto.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.AuditLogService;
import com.hbdt.entity.*;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class StatutoryAccountingService {
    private static final LocalDate DEFAULT_FROM = LocalDate.of(2000, 1, 1);
    private static final int MONEY_SCALE = 2;

    private final BusinessContextService businessContextService;
    private final RevenueLedgerRepository revenueLedgerRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final TaxActivityGroupRepository taxActivityGroupRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final AccountingReportReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final TaxTypeRepository taxTypeRepository;
    private final TaxObligationRepository taxObligationRepository;
    private final TaxPaymentRepository taxPaymentRepository;
    private final AuditLogService auditLogService;

    public StatutoryAccountingService(BusinessContextService businessContextService,
            RevenueLedgerRepository revenueLedgerRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            TaxActivityGroupRepository taxActivityGroupRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            ProductRepository productRepository, UnitRepository unitRepository,
            AccountingReportReviewRepository reviewRepository, UserRepository userRepository,
            TaxTypeRepository taxTypeRepository, TaxObligationRepository taxObligationRepository,
            TaxPaymentRepository taxPaymentRepository, AuditLogService auditLogService) {
        this.businessContextService = businessContextService;
        this.revenueLedgerRepository = revenueLedgerRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.taxActivityGroupRepository = taxActivityGroupRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.taxTypeRepository = taxTypeRepository;
        this.taxObligationRepository = taxObligationRepository;
        this.taxPaymentRepository = taxPaymentRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public StatutoryAccountingBooksResponse getBooks(String username, LocalDate from, LocalDate to) {
        Long businessId = businessContextService.requireBusinessId(username);
        return buildBooks(businessId, from, to, normalizePeriod(from, to));
    }

    @Transactional
    public StatutoryAccountingBooksResponse review(String username, LocalDate from, LocalDate to,
            String requestedStatus, String note) {
        String status = requestedStatus == null ? "" : requestedStatus.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "REJECTED").contains(status)) {
            throw new BadRequestException("Trạng thái báo cáo chỉ được là APPROVED hoặc REJECTED");
        }
        if ("REJECTED".equals(status) && (note == null || note.isBlank())) {
            throw new BadRequestException("Cần nhập lý do và dữ liệu nguồn phải điều chỉnh");
        }
        Long businessId = businessContextService.requireBusinessId(username);
        User reviewer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        StatutoryAccountingBooksResponse current = buildBooks(businessId, from, to, normalizePeriod(from, to));
        LocalDateTime now = LocalDateTime.now();
        String normalizedNote = note == null ? null : note.trim();
        AccountingReportReview savedReview = reviewRepository.save(AccountingReportReview.builder()
                .businessId(businessId).periodFrom(from).periodTo(to).status(status)
                .reviewNote(normalizedNote).reviewedBy(reviewer.getId()).reviewedAt(now)
                .dataSignature(current.dataSignature()).build());
        auditLogService.recordAccountingChange(reviewer, "REVIEW STATUTORY BOOKS", "ACCOUNTING_REPORT",
                savedReview.getId(), Map.of("status", current.reviewStatus(), "signature", current.dataSignature()),
                Map.of("status", status, "reason", normalizedNote == null ? "" : normalizedNote,
                        "signature", current.dataSignature()));
        return new StatutoryAccountingBooksResponse(current.fromDate(), current.toDate(),
                current.legalBasis(), current.taxRateBasis(), current.inventoryCostMethod(),
                current.s1RevenueByTaxGroup(), current.s1TotalRevenue(), current.s2Inventory(),
                current.s4TaxObligations(), current.s4TotalPayable(), current.s4TotalPaid(),
                current.s4TotalRemaining(), status, normalizedNote, reviewer.getFullName(), now,
                current.dataSignature());
    }

    @Transactional
    public StatutoryAccountingBooksResponse recordTaxPayment(String username, CreateTaxPaymentRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        User actor = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        Period period = normalizePeriod(request.fromDate(), request.toDate());
        buildBooks(businessId, request.fromDate(), request.toDate(), period);
        String taxCode = request.taxCode().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("VAT", "PIT").contains(taxCode)) {
            throw new BadRequestException("Sắc thuế chỉ được là VAT hoặc PIT");
        }
        TaxObligation obligation = taxObligationRepository
                .findByBusinessIdAndObligationCode(businessId, obligationCode(taxCode, period))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nghĩa vụ thuế trong kỳ"));
        BigDecimal paidBefore = zero(taxPaymentRepository.sumPaidByObligationId(obligation.getId()));
        if (paidBefore.add(request.paymentAmount()).compareTo(obligation.getTaxAmount()) > 0) {
            throw new BadRequestException("Số tiền nộp vượt quá nghĩa vụ thuế còn lại trong kỳ");
        }
        TaxPayment payment = taxPaymentRepository.save(TaxPayment.builder()
                .taxObligationId(obligation.getId()).documentNumber(trim(request.documentNumber()))
                .paymentDate(request.paymentDate()).paymentAmount(money(request.paymentAmount()))
                .paymentMethod(trim(request.paymentMethod())).referenceNumber(trim(request.referenceNumber()))
                .note(trim(request.note())).createdBy(actor.getId()).build());
        auditLogService.recordAccountingChange(actor, "RECORD TAX PAYMENT", "TAX_PAYMENT", payment.getId(),
                Map.of("paidBefore", paidBefore), Map.of("taxCode", taxCode,
                        "amount", money(request.paymentAmount()), "documentNumber",
                        request.documentNumber() == null ? "" : request.documentNumber()));
        return buildBooks(businessId, request.fromDate(), request.toDate(), period);
    }

    private StatutoryAccountingBooksResponse buildBooks(Long businessId, LocalDate requestedFrom,
            LocalDate requestedTo, Period period) {
        List<RevenueLedgerEntry> entries = revenueLedgerRepository
                .findAllByBusinessIdAndStatusAndConfirmedAtBetweenOrderByConfirmedAtAscIdAsc(
                        businessId, "ACTIVE", period.from(), period.to());
        Map<Long, SalesOrderItem> orderItems = salesOrderItemRepository
                .findAllById(entries.stream().map(RevenueLedgerEntry::getSalesOrderItemId).toList())
                .stream().collect(Collectors.toMap(SalesOrderItem::getId, Function.identity()));
        List<Long> groupIds = orderItems.values().stream().map(SalesOrderItem::getTaxActivityGroupId)
                .filter(Objects::nonNull).distinct().toList();
        Map<Long, TaxActivityGroup> groups = taxActivityGroupRepository.findAllById(groupIds).stream()
                .collect(Collectors.toMap(TaxActivityGroup::getId, Function.identity()));

        Map<String, TaxAccumulator> groupedRevenue = new LinkedHashMap<>();
        for (RevenueLedgerEntry entry : entries) {
            SalesOrderItem item = orderItems.get(entry.getSalesOrderItemId());
            Long groupId = item == null ? null : item.getTaxActivityGroupId();
            TaxActivityGroup group = groupId == null ? null : groups.get(groupId);
            BigDecimal vatRate = item == null ? BigDecimal.ZERO : zero(item.getVatCalculationRate());
            BigDecimal pitRate = item == null ? BigDecimal.ZERO : zero(item.getPitCalculationRate());
            String key = groupId == null ? "UNCLASSIFIED" : groupId.toString();
            TaxAccumulator accumulator = groupedRevenue.computeIfAbsent(key, ignored ->
                    new TaxAccumulator(groupId, group == null ? "UNCLASSIFIED" : group.getActivityCode(),
                            group == null ? "Chưa phân loại nhóm thuế" : group.getActivityName(),
                            vatRate, pitRate));
            accumulator.revenue = accumulator.revenue.add(zero(entry.getLineTotal()));
        }
        List<S1TaxGroupSummaryResponse> s1 = groupedRevenue.values().stream()
                .map(TaxAccumulator::toResponse).toList();
        BigDecimal totalRevenue = sum(s1.stream().map(S1TaxGroupSummaryResponse::revenue).toList());
        BigDecimal vat = sum(s1.stream().map(S1TaxGroupSummaryResponse::vatPayable).toList());
        BigDecimal pit = sum(s1.stream().map(S1TaxGroupSummaryResponse::pitPayable).toList());
        List<S2InventoryBookItemResponse> s2 = buildS2(businessId, period);
        S4TaxObligationResponse vatLine = syncTaxLine(businessId, period, "VAT",
                "Thuế giá trị gia tăng", totalRevenue, vat);
        S4TaxObligationResponse pitLine = syncTaxLine(businessId, period, "PIT",
                "Thuế thu nhập cá nhân", totalRevenue, pit);
        List<S4TaxObligationResponse> s4 = List.of(vatLine, pitLine);
        BigDecimal totalTax = money(vat.add(pit));
        BigDecimal totalPaid = money(vatLine.paidAmount().add(pitLine.paidAmount()));
        BigDecimal totalRemaining = money(vatLine.remainingAmount().add(pitLine.remainingAmount()));
        String signature = signature(totalRevenue, s1, s2, totalTax, totalPaid);
        AccountingReportReview review = reviewRepository
                .findFirstByBusinessIdAndPeriodFromAndPeriodToAndDataSignatureOrderByReviewedAtDescIdDesc(
                        businessId, requestedFrom, requestedTo, signature).orElse(null);
        String reviewerName = review == null ? null : userRepository.findById(review.getReviewedBy())
                .map(User::getFullName).orElse("Tài khoản #" + review.getReviewedBy());
        return new StatutoryAccountingBooksResponse(requestedFrom, requestedTo,
                "Thông tư 88/2021/TT-BTC - S1-HKD, S2-HKD, S4-HKD",
                "Tỷ lệ GTGT/TNCN được chụp tại thời điểm xác nhận đơn hàng",
                "Bình quân gia quyền liên hoàn", s1, money(totalRevenue), s2, s4, totalTax,
                totalPaid, totalRemaining,
                review == null ? "DRAFT" : review.getStatus(),
                review == null ? null : review.getReviewNote(), reviewerName,
                review == null ? null : review.getReviewedAt(), signature);
    }

    private List<S2InventoryBookItemResponse> buildS2(Long businessId, Period period) {
        List<InventoryTransaction> transactions = inventoryTransactionRepository
                .findAllByBusinessIdAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(businessId, period.to());
        Map<Long, List<InventoryTransaction>> byProduct = transactions.stream().collect(
                Collectors.groupingBy(InventoryTransaction::getProductId, LinkedHashMap::new, Collectors.toList()));
        Map<Long, Product> products = productRepository.findAllById(byProduct.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        Map<Long, Unit> units = unitRepository.findAllById(products.values().stream()
                        .map(Product::getBaseUnitId).distinct().toList()).stream()
                .collect(Collectors.toMap(Unit::getId, Function.identity()));
        List<S2InventoryBookItemResponse> result = new ArrayList<>();
        for (var productEntry : byProduct.entrySet()) {
            List<InventoryTransaction> productTransactions = productEntry.getValue();
            InventoryTransaction first = productTransactions.getFirst();
            BigDecimal firstChange = zero(first.getQuantityChange());
            BigDecimal ledgerQty = zero(first.getBalanceAfter()).subtract(firstChange);
            BigDecimal ledgerValue = balanceBefore(first);
            boolean costComplete = !(ledgerQty.signum() > 0 && ledgerValue.signum() == 0);

            BigDecimal openingQty = ledgerQty, openingValue = ledgerValue;
            BigDecimal inQty = BigDecimal.ZERO, inValue = BigDecimal.ZERO;
            BigDecimal returnedQty = BigDecimal.ZERO, returnedValue = BigDecimal.ZERO;
            BigDecimal outQty = BigDecimal.ZERO, outValue = BigDecimal.ZERO;
            for (InventoryTransaction transaction : productTransactions) {
                BigDecimal change = zero(transaction.getQuantityChange());
                BigDecimal transactionValue = zero(transaction.getTransactionValue());
                if (change.signum() == 0 && transaction.getBalanceAfter() != null) {
                    // Older records may only contain a balance snapshot. Keep it as the
                    // opening point instead of silently dropping the pre-existing stock.
                    ledgerQty = zero(transaction.getBalanceAfter());
                    ledgerValue = zero(transaction.getBalanceValue());
                    if (transaction.getCreatedAt().isBefore(period.from())) {
                        openingQty = ledgerQty;
                        openingValue = ledgerValue;
                    }
                    continue;
                }
                if (change.signum() != 0 && transactionValue.signum() == 0) {
                    costComplete = false;
                }
                if (transaction.getCreatedAt().isBefore(period.from())) {
                    ledgerQty = ledgerQty.add(change);
                    ledgerValue = applyValueChange(ledgerValue, change, transactionValue);
                    openingQty = ledgerQty;
                    openingValue = ledgerValue;
                    continue;
                }
                if (change.signum() > 0) {
                    if ("CANCEL_SALE".equalsIgnoreCase(transaction.getTransactionType())) {
                        returnedQty = returnedQty.add(change);
                        returnedValue = returnedValue.add(transactionValue);
                    } else {
                        inQty = inQty.add(change);
                        inValue = inValue.add(transactionValue);
                    }
                } else if (change.signum() < 0) {
                    outQty = outQty.add(change.abs());
                    outValue = outValue.add(transactionValue);
                }
                ledgerQty = ledgerQty.add(change);
                ledgerValue = applyValueChange(ledgerValue, change, transactionValue);
            }
            BigDecimal closingQty = ledgerQty;
            BigDecimal closingValue = ledgerValue;
            if (openingQty.signum() > 0 && openingValue.signum() == 0
                    || closingQty.signum() > 0 && closingValue.signum() == 0
                    || openingValue.signum() < 0 || closingValue.signum() < 0) {
                costComplete = false;
            }
            Product product = products.get(productEntry.getKey());
            Unit unit = product == null ? null : units.get(product.getBaseUnitId());
            BigDecimal averageCost = closingQty.signum() == 0 ? BigDecimal.ZERO
                    : closingValue.divide(closingQty, MONEY_SCALE, RoundingMode.HALF_UP);
            result.add(new S2InventoryBookItemResponse(productEntry.getKey(),
                    product == null ? "—" : product.getProductCode(),
                    product == null ? "Sản phẩm #" + productEntry.getKey() : product.getProductName(),
                    unit == null ? "—" : unit.getUnitName(), quantity(openingQty), money(openingValue),
                    quantity(inQty), money(inValue), quantity(returnedQty), money(returnedValue),
                    quantity(outQty), money(outValue), quantity(closingQty), money(closingValue),
                    money(averageCost), costComplete, costComplete ? null
                            : "Thiếu giá vốn cho tồn đầu hoặc một giao dịch kho; cần bổ sung chứng từ giá nhập."));
        }
        result.sort(Comparator.comparing(S2InventoryBookItemResponse::productName,
                String.CASE_INSENSITIVE_ORDER));
        return result;
    }

    private BigDecimal balanceBefore(InventoryTransaction transaction) {
        BigDecimal balanceValue = zero(transaction.getBalanceValue());
        BigDecimal transactionValue = zero(transaction.getTransactionValue());
        BigDecimal change = zero(transaction.getQuantityChange());
        if (change.signum() > 0) return balanceValue.subtract(transactionValue);
        if (change.signum() < 0) return balanceValue.add(transactionValue);
        return BigDecimal.ZERO;
    }

    private BigDecimal applyValueChange(BigDecimal balance, BigDecimal quantityChange,
            BigDecimal transactionValue) {
        return quantityChange.signum() < 0
                ? balance.subtract(transactionValue)
                : balance.add(transactionValue);
    }

    private S4TaxObligationResponse syncTaxLine(Long businessId, Period period, String code,
            String name, BigDecimal revenue, BigDecimal payable) {
        TaxType type = taxTypeRepository.findFirstByTaxCodeIgnoreCase(code).orElseGet(() ->
                taxTypeRepository.save(TaxType.builder().taxCode(code).taxName(name)
                        .description("Nghĩa vụ thuế tự động từ sổ S1-HKD").status("ACTIVE").build()));
        String obligationCode = obligationCode(code, period);
        TaxObligation obligation = taxObligationRepository
                .findByBusinessIdAndObligationCode(businessId, obligationCode)
                .orElseGet(() -> TaxObligation.builder().businessId(businessId).taxTypeId(type.getId())
                        .obligationCode(obligationCode).periodFrom(period.from().toLocalDate())
                        .periodTo(period.to().toLocalDate()).taxableRevenue(BigDecimal.ZERO)
                        .taxAmount(BigDecimal.ZERO).status("DRAFT").build());
        obligation.setTaxableRevenue(money(revenue));
        obligation.setTaxAmount(money(payable));
        obligation.setDescription(name + " - tổng hợp tự động từ giao dịch đã xác nhận");
        obligation = taxObligationRepository.save(obligation);
        BigDecimal paid = money(taxPaymentRepository.sumPaidByObligationId(obligation.getId()));
        BigDecimal remaining = money(obligation.getTaxAmount().subtract(paid));
        return new S4TaxObligationResponse(code, name, money(revenue), obligation.getTaxAmount(), paid, remaining);
    }

    private String obligationCode(String taxCode, Period period) {
        return taxCode + "-" + period.from().toLocalDate() + "-" + period.to().toLocalDate();
    }

    private Period normalizePeriod(LocalDate from, LocalDate to) {
        LocalDate start = from == null ? DEFAULT_FROM : from;
        LocalDate end = to == null ? LocalDate.now() : to;
        if (start.isAfter(end)) throw new BadRequestException("Từ ngày không được sau đến ngày");
        return new Period(start.atStartOfDay(), end.atTime(LocalTime.MAX));
    }

    private String signature(Object... values) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(Arrays.deepToString(values).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Không thể tạo chữ ký dữ liệu báo cáo", exception);
        }
    }

    private static BigDecimal zero(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private static BigDecimal money(BigDecimal value) { return zero(value).setScale(MONEY_SCALE, RoundingMode.HALF_UP); }
    private static BigDecimal quantity(BigDecimal value) { return zero(value).setScale(3, RoundingMode.HALF_UP); }
    private static BigDecimal sum(List<BigDecimal> values) { return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add); }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private record Period(LocalDateTime from, LocalDateTime to) { }

    private static final class TaxAccumulator {
        private final Long id;
        private final String code;
        private final String name;
        private final BigDecimal vatRate;
        private final BigDecimal pitRate;
        private BigDecimal revenue = BigDecimal.ZERO;

        private TaxAccumulator(Long id, String code, String name, BigDecimal vatRate, BigDecimal pitRate) {
            this.id = id; this.code = code; this.name = name;
            this.vatRate = zero(vatRate); this.pitRate = zero(pitRate);
        }

        private S1TaxGroupSummaryResponse toResponse() {
            BigDecimal normalizedRevenue = money(revenue);
            BigDecimal vat = normalizedRevenue.multiply(vatRate)
                    .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
            BigDecimal pit = normalizedRevenue.multiply(pitRate)
                    .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
            return new S1TaxGroupSummaryResponse(id, code, name, vatRate, pitRate,
                    normalizedRevenue, vat, pit);
        }
    }
}
