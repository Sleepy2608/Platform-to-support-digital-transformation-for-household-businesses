package com.hbdt.accounting.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.accounting.dto.FilledTemplateColumnResponse;
import com.hbdt.accounting.dto.FilledTemplateReportResponse;
import com.hbdt.accounting.dto.StatutoryAccountingBooksResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.RevenueLedgerEntry;
import com.hbdt.entity.SalesOrderItem;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import com.hbdt.repository.RevenueLedgerRepository;
import com.hbdt.repository.SalesOrderItemRepository;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AccountingTemplateFillService {
    private static final LocalDate DEFAULT_FROM = LocalDate.of(2000, 1, 1);

    private final BusinessContextService businessContextService;
    private final StatutoryAccountingService statutoryAccountingService;
    private final RevenueLedgerService revenueLedgerService;
    private final RevenueLedgerRepository revenueLedgerRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final ReportTemplateRepository templateRepository;
    private final ReportTemplateVersionRepository versionRepository;

    public AccountingTemplateFillService(BusinessContextService businessContextService,
            StatutoryAccountingService statutoryAccountingService,
            RevenueLedgerService revenueLedgerService,
            RevenueLedgerRepository revenueLedgerRepository,
            SalesOrderItemRepository salesOrderItemRepository,
            ReportTemplateRepository templateRepository,
            ReportTemplateVersionRepository versionRepository) {
        this.businessContextService = businessContextService;
        this.statutoryAccountingService = statutoryAccountingService;
        this.revenueLedgerService = revenueLedgerService;
        this.revenueLedgerRepository = revenueLedgerRepository;
        this.salesOrderItemRepository = salesOrderItemRepository;
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
    }

    @Transactional
    public List<FilledTemplateReportResponse> fillActiveTemplates(
            String username, LocalDate requestedFrom, LocalDate requestedTo) {
        Long businessId = businessContextService.requireBusinessId(username);
        LocalDate from = requestedFrom == null ? DEFAULT_FROM : requestedFrom;
        LocalDate to = requestedTo == null ? LocalDate.now() : requestedTo;
        if (to.isBefore(from)) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu");
        }

        StatutoryAccountingBooksResponse books = statutoryAccountingService
                .getBooks(username, requestedFrom, requestedTo);
        RevenueLedgerPageResponse management = revenueLedgerService
                .search(username, requestedFrom, requestedTo, null, null, 0, 1);
        List<RevenueLedgerEntry> revenueEntries = revenueLedgerRepository
                .findAllByBusinessIdAndStatusAndConfirmedAtBetweenOrderByConfirmedAtAscIdAsc(
                        businessId, "ACTIVE", LocalDateTime.of(from, LocalTime.MIN),
                        LocalDateTime.of(to, LocalTime.MAX));
        Map<Long, SalesOrderItem> orderItems = salesOrderItemRepository
                .findAllById(revenueEntries.stream().map(RevenueLedgerEntry::getSalesOrderItemId).toList())
                .stream().collect(Collectors.toMap(SalesOrderItem::getId, Function.identity()));

        Map<TemplateType, ReportTemplate> latestByType = new EnumMap<>(TemplateType.class);
        templateRepository.findAllByStatusOrderByUpdatedAtDesc(TemplateStatus.ACTIVE).stream()
                .sorted(Comparator.comparing(ReportTemplate::getUpdatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .forEach(template -> latestByType.putIfAbsent(template.getTemplateType(), template));

        return latestByType.values().stream()
                .map(template -> fillTemplate(template, books, management, revenueEntries, orderItems))
                .toList();
    }

    private FilledTemplateReportResponse fillTemplate(ReportTemplate template,
            StatutoryAccountingBooksResponse books, RevenueLedgerPageResponse management,
            List<RevenueLedgerEntry> revenueEntries, Map<Long, SalesOrderItem> orderItems) {
        Set<String> warnings = new LinkedHashSet<>();
        ReportTemplateVersion version = resolveVersion(template);
        if (version == null) {
            warnings.add("Biểu mẫu chưa có phiên bản để điền dữ liệu.");
            return response(template, null, List.of(), List.of(), warnings);
        }

        List<FilledTemplateColumnResponse> columns = readColumns(version.getTemplateSchema(), warnings);
        List<Map<String, Object>> sourceRows = sourceRows(template.getTemplateType(), books,
                management, revenueEntries, orderItems, warnings);
        Set<String> supportedKeys = supportedKeys(template.getTemplateType());
        for (FilledTemplateColumnResponse column : columns) {
            if (!supportedKeys.contains(column.key())) {
                warnings.add("Cột '" + column.label() + "' chưa được nối với dữ liệu hệ thống.");
            }
        }

        List<Map<String, Object>> rows = sourceRows.stream()
                .map(source -> projectRow(source, columns, warnings))
                .toList();
        if (sourceRows.isEmpty()) {
            warnings.add("Không có dữ liệu đã xác nhận trong kỳ báo cáo.");
        }
        return response(template, version, columns, rows, warnings);
    }

    private ReportTemplateVersion resolveVersion(ReportTemplate template) {
        if (template.getCurrentVersionId() != null) {
            ReportTemplateVersion current = versionRepository.findById(template.getCurrentVersionId())
                    .orElse(null);
            if (current != null && current.getReportTemplateId().equals(template.getId())) {
                return current;
            }
        }
        return versionRepository.findTopByReportTemplateIdOrderByVersionNumberDesc(template.getId())
                .orElse(null);
    }

    private List<FilledTemplateColumnResponse> readColumns(JsonNode schema, Set<String> warnings) {
        if (schema == null || schema.isNull()) {
            warnings.add("Phiên bản biểu mẫu chưa có cấu hình cột.");
            return List.of();
        }
        JsonNode nodes = schema.has("columns") ? schema.get("columns") : schema.get("fields");
        if (nodes == null || !nodes.isArray()) {
            warnings.add("Cấu hình biểu mẫu phải có mảng columns hoặc fields.");
            return List.of();
        }
        List<FilledTemplateColumnResponse> result = new ArrayList<>();
        for (JsonNode node : nodes) {
            String key = text(node, "key");
            if (key == null) {
                warnings.add("Có cột không có key nên đã được bỏ qua.");
                continue;
            }
            String label = text(node, "label");
            String type = text(node, "type");
            result.add(new FilledTemplateColumnResponse(key,
                    label == null ? key : label, type == null ? "text" : type,
                    node.path("required").asBoolean(false)));
        }
        return result;
    }

    private List<Map<String, Object>> sourceRows(TemplateType type,
            StatutoryAccountingBooksResponse books, RevenueLedgerPageResponse management,
            List<RevenueLedgerEntry> revenueEntries, Map<Long, SalesOrderItem> orderItems,
            Set<String> warnings) {
        return switch (type) {
            case REVENUE_LEDGER -> revenueEntries.stream().map(entry -> {
                SalesOrderItem item = orderItems.get(entry.getSalesOrderItemId());
                BigDecimal vatRate = item == null ? null : item.getVatCalculationRate();
                BigDecimal pitRate = item == null ? null : item.getPitCalculationRate();
                Map<String, Object> row = row();
                row.put("voucherDate", entry.getConfirmedAt().toLocalDate());
                row.put("invoiceNumber", entry.getOrderCode());
                row.put("customerName", entry.getCustomerName());
                row.put("productName", entry.getProductName());
                row.put("unit", entry.getUnitName());
                row.put("quantity", entry.getQuantity());
                row.put("unitPrice", entry.getUnitPrice());
                row.put("revenue", entry.getLineTotal());
                row.put("vatAmount", percentage(entry.getLineTotal(), vatRate));
                row.put("pitAmount", percentage(entry.getLineTotal(), pitRate));
                row.put("notes", vatRate == null || pitRate == null ? "Chưa phân loại đủ tỷ lệ thuế" : null);
                return row;
            }).toList();
            case INVENTORY_LEDGER -> books.s2Inventory().stream().map(item -> {
                Map<String, Object> row = row();
                row.put("productCode", item.productCode());
                row.put("productName", item.productName());
                row.put("unit", item.baseUnitName());
                row.put("openingQuantity", item.openingQuantity());
                row.put("openingValue", item.openingValue());
                row.put("stockInQuantity", item.stockInQuantity());
                row.put("stockInValue", item.stockInValue());
                row.put("returnedQuantity", item.returnedQuantity());
                row.put("returnedValue", item.returnedValue());
                row.put("stockOutQuantity", item.stockOutQuantity());
                row.put("stockOutValue", item.stockOutValue());
                row.put("closingQuantity", item.closingQuantity());
                row.put("closingValue", item.closingValue());
                row.put("averageUnitCost", item.averageUnitCost());
                return row;
            }).toList();
            case TAX_OBLIGATION_LEDGER -> books.s4TaxObligations().stream().map(item -> {
                Map<String, Object> row = row();
                row.put("taxCode", item.taxCode());
                row.put("taxName", item.taxName());
                row.put("taxableRevenue", item.taxableRevenue());
                row.put("taxPayable", item.taxPayable());
                row.put("paidAmount", item.paidAmount());
                row.put("remainingAmount", item.remainingAmount());
                return row;
            }).toList();
            case TAX_SUMMARY -> books.s1RevenueByTaxGroup().stream().map(item -> {
                Map<String, Object> row = row();
                row.put("taxCategory", item.activityName());
                row.put("taxableRevenue", item.revenue());
                row.put("vatRate", item.vatRate());
                row.put("pitRate", item.pitRate());
                row.put("vatAmount", item.vatPayable());
                row.put("pitAmount", item.pitPayable());
                row.put("totalTax", item.vatPayable().add(item.pitPayable()));
                return row;
            }).toList();
            case DEBT_REPORT -> management.debts().stream().map(item -> {
                Map<String, Object> row = row();
                row.put("partnerCode", item.customerCode());
                row.put("partnerName", item.customerName());
                row.put("openingBalance", item.openingBalance());
                row.put("incurredAmount", item.debtIncurred());
                row.put("paidAmount", item.amountCollected());
                row.put("adjustments", item.adjustments());
                row.put("closingBalance", item.closingBalance());
                return row;
            }).toList();
            case CASH_FLOW -> {
                Map<String, Object> row = row();
                row.put("transactionDate", management.operations().toDate());
                row.put("voucherNo", "TONG-HOP-KY");
                row.put("description", "Tổng hợp dòng tiền hoạt động trong kỳ");
                row.put("cashIn", management.operations().cashCollected());
                row.put("cashOut", management.operations().stockPurchaseValue());
                row.put("balance", management.operations().netOperatingCashFlow());
                yield List.of(row);
            }
            case EXPENSE_LEDGER, BALANCE_SHEET, ACCOUNTING_BOOK -> {
                warnings.add("Hệ thống chưa có nguồn dữ liệu đủ tin cậy cho loại biểu mẫu " + type + ".");
                yield List.of();
            }
        };
    }

    private Set<String> supportedKeys(TemplateType type) {
        return switch (type) {
            case REVENUE_LEDGER -> Set.of("voucherDate", "invoiceNumber", "customerName",
                    "productName", "unit", "quantity", "unitPrice", "revenue",
                    "vatAmount", "pitAmount", "notes");
            case INVENTORY_LEDGER -> Set.of("productCode", "productName", "unit",
                    "openingQuantity", "openingValue", "stockInQuantity", "stockInValue",
                    "returnedQuantity", "returnedValue", "stockOutQuantity", "stockOutValue",
                    "closingQuantity", "closingValue", "averageUnitCost");
            case TAX_OBLIGATION_LEDGER -> Set.of("taxCode", "taxName", "taxableRevenue",
                    "taxPayable", "paidAmount", "remainingAmount");
            case TAX_SUMMARY -> Set.of("taxCategory", "taxableRevenue", "vatRate", "pitRate",
                    "vatAmount", "pitAmount", "totalTax");
            case DEBT_REPORT -> Set.of("partnerCode", "partnerName", "openingBalance",
                    "incurredAmount", "paidAmount", "adjustments", "closingBalance");
            case CASH_FLOW -> Set.of("transactionDate", "voucherNo", "description", "cashIn",
                    "cashOut", "balance");
            default -> Set.of();
        };
    }

    private Map<String, Object> projectRow(Map<String, Object> source,
            List<FilledTemplateColumnResponse> columns, Set<String> warnings) {
        Map<String, Object> projected = row();
        for (FilledTemplateColumnResponse column : columns) {
            Object value = source.get(column.key());
            projected.put(column.key(), value);
            if (column.required() && value == null) {
                warnings.add("Trường bắt buộc '" + column.label() + "' đang thiếu dữ liệu.");
            }
        }
        return projected;
    }

    private FilledTemplateReportResponse response(ReportTemplate template,
            ReportTemplateVersion version, List<FilledTemplateColumnResponse> columns,
            List<Map<String, Object>> rows, Set<String> warnings) {
        return new FilledTemplateReportResponse(template.getId(),
                version == null ? null : version.getId(),
                version == null ? null : version.getVersionNumber(), template.getTemplateCode(),
                template.getTemplateName(), template.getTemplateType(), template.getOfficialFormCode(),
                template.getLegalBasis(), columns, rows, List.copyOf(warnings));
    }

    private Map<String, Object> row() {
        return new LinkedHashMap<>();
    }

    private BigDecimal percentage(BigDecimal amount, BigDecimal rate) {
        if (amount == null || rate == null) {
            return null;
        }
        return amount.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isTextual() || value.asText().isBlank()) {
            return null;
        }
        return value.asText().trim();
    }
}
