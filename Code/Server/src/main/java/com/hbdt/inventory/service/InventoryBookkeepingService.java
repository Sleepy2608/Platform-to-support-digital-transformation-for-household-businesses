package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.AddressFormatterService;
import com.hbdt.entity.BusinessProfile;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.Unit;
import com.hbdt.inventory.dto.InventoryBookkeepingSummaryResponse;
import com.hbdt.inventory.dto.InventoryLedgerEntryResponse;
import com.hbdt.inventory.dto.InventoryLedgerResponse;
import com.hbdt.inventory.dto.InventoryProductSummaryResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.BusinessProfileRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service nghiệp vụ phục vụ Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa (Mẫu số S2-HKD theo Thông tư 88/2021/TT-BTC).
 */
@Service
public class InventoryBookkeepingService {

    private static final int QUANTITY_SCALE = 3;
    private static final int MONEY_SCALE = 2;

    private final BusinessContextService businessContextService;
    private final BusinessProfileRepository businessProfileRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final StockImportRepository stockImportRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AddressFormatterService addressFormatterService;

    public InventoryBookkeepingService(
            BusinessContextService businessContextService,
            BusinessProfileRepository businessProfileRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            InventoryTransactionRepository transactionRepository,
            StockImportRepository stockImportRepository,
            SalesOrderRepository salesOrderRepository,
            AddressFormatterService addressFormatterService
    ) {
        this.businessContextService = businessContextService;
        this.businessProfileRepository = businessProfileRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.transactionRepository = transactionRepository;
        this.stockImportRepository = stockImportRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.addressFormatterService = addressFormatterService;
    }

    /**
     * Lấy Sổ chi tiết hàng hóa Mẫu S2-HKD cho một sản phẩm trong kỳ báo cáo.
     */
    @Transactional(readOnly = true)
    public InventoryLedgerResponse getLedger(
            String actorUsername,
            Long productId,
            String startDateStr,
            String endDateStr
    ) {
        if (productId == null) {
            throw new BadRequestException("Vui lòng chọn sản phẩm để xem sổ S2-HKD");
        }

        Long businessId = businessContextService.requireBusinessId(actorUsername);
        BusinessProfile business = businessProfileRepository.findById(businessId).orElse(null);

        Product product = productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm #" + productId + " thuộc hộ kinh doanh"));

        Unit baseUnit = product.getBaseUnitId() != null
                ? unitRepository.findById(product.getBaseUnitId()).orElse(null)
                : null;
        String unitName = baseUnit != null ? baseUnit.getUnitName() : "—";

        LocalDateTime startDate = parseDateTime(startDateStr, false, LocalDate.now().withDayOfMonth(1).atStartOfDay());
        LocalDateTime endDate = parseDateTime(endDateStr, true, LocalDate.now().atTime(LocalTime.MAX));

        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Thời gian bắt đầu không được lớn hơn thời gian kết thúc");
        }

        // 1. Số dư đầu kỳ: lấy từ giao dịch cuối cùng TRƯỚC startDate (không dùng tồn hiện tại)
        Optional<InventoryTransaction> openingTxOpt = transactionRepository
                .findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(businessId, productId, startDate);

        BigDecimal openingQuantity;
        BigDecimal openingAmount;
        BigDecimal openingUnitCost;

        if (openingTxOpt.isPresent()) {
            InventoryTransaction openingTx = openingTxOpt.get();
            openingQuantity = openingTx.getBalanceAfter() != null
                    ? openingTx.getBalanceAfter().setScale(QUANTITY_SCALE, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            openingAmount = openingTx.getBalanceValue() != null
                    ? openingTx.getBalanceValue().setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                    : (openingTx.getUnitCost() != null
                    ? openingQuantity.multiply(openingTx.getUnitCost()).setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(MONEY_SCALE));
            openingUnitCost = openingQuantity.signum() > 0 && openingAmount != null
                    ? openingAmount.divide(openingQuantity, MONEY_SCALE, RoundingMode.HALF_UP)
                    : (openingTx.getUnitCost() != null ? openingTx.getUnitCost() : BigDecimal.ZERO.setScale(MONEY_SCALE));
        } else {
            openingQuantity = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            openingAmount = BigDecimal.ZERO.setScale(MONEY_SCALE);
            openingUnitCost = BigDecimal.ZERO.setScale(MONEY_SCALE);
        }

        // 2. Lấy danh sách giao dịch phát sinh trong kỳ theo thứ tự thời gian tăng dần
        List<InventoryTransaction> transactions = transactionRepository
                .findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                        businessId, productId, startDate, endDate
                );

        // Nạp thông tin chứng từ (StockImport, SalesOrder) bằng batch lookup tránh N+1
        List<Long> importIds = transactions.stream()
                .filter(t -> "STOCK_IMPORT".equals(t.getReferenceType()) && t.getReferenceId() != null)
                .map(InventoryTransaction::getReferenceId)
                .distinct()
                .toList();
        Map<Long, StockImport> importMap = stockImportRepository.findAllById(importIds).stream()
                .collect(Collectors.toMap(StockImport::getId, Function.identity(), (a, b) -> a));

        List<Long> orderIds = transactions.stream()
                .filter(t -> "SALES_ORDER".equals(t.getReferenceType()) && t.getReferenceId() != null)
                .map(InventoryTransaction::getReferenceId)
                .distinct()
                .toList();
        Map<Long, SalesOrder> orderMap = salesOrderRepository.findAllById(orderIds).stream()
                .collect(Collectors.toMap(SalesOrder::getId, Function.identity(), (a, b) -> a));

        // 3. Tính toán từng dòng và tổng phát sinh
        BigDecimal totalImportQuantity = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
        BigDecimal totalImportAmount = BigDecimal.ZERO.setScale(MONEY_SCALE);
        BigDecimal totalExportQuantity = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
        BigDecimal totalExportAmount = BigDecimal.ZERO.setScale(MONEY_SCALE);

        List<InventoryLedgerEntryResponse> entries = new ArrayList<>();

        for (InventoryTransaction tx : transactions) {
            BigDecimal importQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            BigDecimal importAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);
            BigDecimal exportQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            BigDecimal exportAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);

            BigDecimal txVal = tx.getTransactionValue() != null
                    ? tx.getTransactionValue().setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(MONEY_SCALE);
            BigDecimal change = tx.getQuantityChange() != null
                    ? tx.getQuantityChange().setScale(QUANTITY_SCALE, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(QUANTITY_SCALE);

            String txType = tx.getTransactionType() != null ? tx.getTransactionType() : "";
            switch (txType) {
                case "STOCK_IN", "CANCEL_SALE" -> {
                    importQty = change.abs();
                    importAmt = txVal;
                }
                case "STOCK_OUT" -> {
                    exportQty = change.abs();
                    exportAmt = txVal;
                }
                case "ADJUSTMENT" -> {
                    if (change.signum() >= 0) {
                        importQty = change;
                        importAmt = txVal;
                    } else {
                        exportQty = change.abs();
                        exportAmt = txVal;
                    }
                }
                default -> {
                    if (change.signum() >= 0) {
                        importQty = change;
                        importAmt = txVal;
                    } else {
                        exportQty = change.abs();
                        exportAmt = txVal;
                    }
                }
            }

            totalImportQuantity = totalImportQuantity.add(importQty);
            totalImportAmount = totalImportAmount.add(importAmt);
            totalExportQuantity = totalExportQuantity.add(exportQty);
            totalExportAmount = totalExportAmount.add(exportAmt);

            // Xác định số chứng từ và ngày chứng từ
            String voucherNo = resolveVoucherNo(tx, importMap, orderMap);
            LocalDateTime voucherDate = resolveVoucherDate(tx, importMap, orderMap);
            String description = resolveDescription(tx, voucherNo);

            entries.add(InventoryLedgerEntryResponse.builder()
                    .transactionId(tx.getId())
                    .transactionType(tx.getTransactionType())
                    .referenceType(tx.getReferenceType())
                    .referenceId(tx.getReferenceId())
                    .referenceCode(voucherNo)
                    .voucherNo(voucherNo)
                    .voucherDate(voucherDate)
                    .description(description)
                    .unitName(unitName)
                    .unitCost(tx.getUnitCost())
                    .importQuantity(importQty)
                    .importAmount(importAmt)
                    .exportQuantity(exportQty)
                    .exportAmount(exportAmt)
                    .balanceAfterQuantity(tx.getBalanceAfter())
                    .balanceAfterValue(tx.getBalanceValue())
                    .createdAt(tx.getCreatedAt())
                    .build());
        }

        // 4. Số dư cuối kỳ
        BigDecimal closingQuantity = openingQuantity.add(totalImportQuantity).subtract(totalExportQuantity)
                .setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
        BigDecimal closingAmount = openingAmount.add(totalImportAmount).subtract(totalExportAmount)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal closingUnitCost = closingQuantity.signum() > 0 && closingAmount != null
                ? closingAmount.divide(closingQuantity, MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(MONEY_SCALE);

        return InventoryLedgerResponse.builder()
                .businessId(businessId)
                .businessName(business != null ? business.getBusinessName() : "—")
                .ownerName(business != null ? business.getOwnerName() : "—")
                .taxCode(business != null ? business.getTaxCode() : "—")
                .businessAddress(resolveBusinessAddress(business))
                .productId(product.getId())
                .productCode(product.getProductCode())
                .productName(product.getProductName())
                .baseUnitId(product.getBaseUnitId())
                .unitName(unitName)
                .startDate(startDate)
                .endDate(endDate)
                .fiscalYear(startDate.getYear())
                .openingQuantity(openingQuantity)
                .openingUnitCost(openingUnitCost)
                .openingAmount(openingAmount)
                .entries(entries)
                .totalImportQuantity(totalImportQuantity)
                .totalImportAmount(totalImportAmount)
                .totalExportQuantity(totalExportQuantity)
                .totalExportAmount(totalExportAmount)
                .netQuantityChange(totalImportQuantity.subtract(totalExportQuantity))
                .netAmountChange(totalImportAmount.subtract(totalExportAmount))
                .closingQuantity(closingQuantity)
                .closingUnitCost(closingUnitCost)
                .closingAmount(closingAmount)
                .build();
    }

    /**
     * Tổng hợp tình hình nhập - xuất - tồn kho theo kỳ (Mẫu S2-HKD).
     */
    @Transactional(readOnly = true)
    public InventoryBookkeepingSummaryResponse getSummary(
            String actorUsername,
            Long specificProductId,
            String startDateStr,
            String endDateStr
    ) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        BusinessProfile business = businessProfileRepository.findById(businessId).orElse(null);

        LocalDateTime startDate = parseDateTime(startDateStr, false, LocalDate.now().withDayOfMonth(1).atStartOfDay());
        LocalDateTime endDate = parseDateTime(endDateStr, true, LocalDate.now().atTime(LocalTime.MAX));

        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Thời gian bắt đầu không được lớn hơn thời gian kết thúc");
        }

        List<Product> products = specificProductId != null
                ? productRepository.findByIdAndBusinessId(specificProductId, businessId)
                        .map(List::of).orElse(List.of())
                : productRepository.findAllByBusinessIdOrderByProductNameAsc(businessId);

        List<Long> unitIds = products.stream()
                .map(Product::getBaseUnitId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, Unit> unitMap = unitRepository.findAllById(unitIds).stream()
                .collect(Collectors.toMap(Unit::getId, Function.identity(), (a, b) -> a));

        List<InventoryProductSummaryResponse> productSummaries = new ArrayList<>();
        BigDecimal grandImportQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
        BigDecimal grandImportAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);
        BigDecimal grandExportQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
        BigDecimal grandExportAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);
        long grandTotalTransactions = 0;

        for (Product prod : products) {
            Unit baseUnit = prod.getBaseUnitId() != null ? unitMap.get(prod.getBaseUnitId()) : null;
            String unitName = baseUnit != null ? baseUnit.getUnitName() : "—";

            // Đầu kỳ
            Optional<InventoryTransaction> openingTxOpt = transactionRepository
                    .findFirstByBusinessIdAndProductIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(businessId, prod.getId(), startDate);

            BigDecimal openingQty = openingTxOpt.map(tx -> tx.getBalanceAfter() != null ? tx.getBalanceAfter() : BigDecimal.ZERO)
                    .orElse(BigDecimal.ZERO).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
            BigDecimal openingAmt = openingTxOpt.map(tx -> tx.getBalanceValue() != null ? tx.getBalanceValue() : BigDecimal.ZERO)
                    .orElse(BigDecimal.ZERO).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            // Trong kỳ
            List<InventoryTransaction> txs = transactionRepository
                    .findByBusinessIdAndProductIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanEqualOrderByCreatedAtAscIdAsc(
                            businessId, prod.getId(), startDate, endDate
                    );
            grandTotalTransactions += txs.size();

            BigDecimal prodImportQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            BigDecimal prodImportAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);
            BigDecimal prodExportQty = BigDecimal.ZERO.setScale(QUANTITY_SCALE);
            BigDecimal prodExportAmt = BigDecimal.ZERO.setScale(MONEY_SCALE);

            for (InventoryTransaction tx : txs) {
                BigDecimal txVal = tx.getTransactionValue() != null ? tx.getTransactionValue() : BigDecimal.ZERO;
                BigDecimal change = tx.getQuantityChange() != null ? tx.getQuantityChange() : BigDecimal.ZERO;

                String txType = tx.getTransactionType() != null ? tx.getTransactionType() : "";
                if ("STOCK_IN".equals(txType) || "CANCEL_SALE".equals(txType) || ("ADJUSTMENT".equals(txType) && change.signum() >= 0)) {
                    prodImportQty = prodImportQty.add(change.abs());
                    prodImportAmt = prodImportAmt.add(txVal);
                } else {
                    prodExportQty = prodExportQty.add(change.abs());
                    prodExportAmt = prodExportAmt.add(txVal);
                }
            }

            BigDecimal closingQty = openingQty.add(prodImportQty).subtract(prodExportQty).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
            BigDecimal closingAmt = openingAmt.add(prodImportAmt).subtract(prodExportAmt).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            grandImportQty = grandImportQty.add(prodImportQty);
            grandImportAmt = grandImportAmt.add(prodImportAmt);
            grandExportQty = grandExportQty.add(prodExportQty);
            grandExportAmt = grandExportAmt.add(prodExportAmt);

            productSummaries.add(InventoryProductSummaryResponse.builder()
                    .productId(prod.getId())
                    .productCode(prod.getProductCode())
                    .productName(prod.getProductName())
                    .unitName(unitName)
                    .openingQuantity(openingQty)
                    .openingAmount(openingAmt)
                    .importQuantity(prodImportQty)
                    .importAmount(prodImportAmt)
                    .exportQuantity(prodExportQty)
                    .exportAmount(prodExportAmt)
                    .closingQuantity(closingQty)
                    .closingAmount(closingAmt)
                    .build());
        }

        return InventoryBookkeepingSummaryResponse.builder()
                .businessId(businessId)
                .businessName(business != null ? business.getBusinessName() : "—")
                .taxCode(business != null ? business.getTaxCode() : "—")
                .businessAddress(resolveBusinessAddress(business))
                .startDate(startDate)
                .endDate(endDate)
                .totalImportQuantity(grandImportQty)
                .totalImportAmount(grandImportAmt)
                .totalExportQuantity(grandExportQty)
                .totalExportAmount(grandExportAmt)
                .totalTransactions(grandTotalTransactions)
                .productSummaries(productSummaries)
                .build();
    }

    private String resolveBusinessAddress(BusinessProfile business) {
        if (business == null || business.getAddress() == null || business.getAddress().isBlank()) {
            return "—";
        }
        String formatted = addressFormatterService.formatAddress(business.getAddress());
        return (formatted != null && !formatted.isBlank()) ? formatted : "—";
    }

    private String resolveVoucherNo(
            InventoryTransaction tx,
            Map<Long, StockImport> importMap,
            Map<Long, SalesOrder> orderMap
    ) {
        if ("STOCK_IMPORT".equals(tx.getReferenceType()) && tx.getReferenceId() != null) {
            StockImport si = importMap.get(tx.getReferenceId());
            return si != null && si.getImportCode() != null ? si.getImportCode() : "NK-" + tx.getReferenceId();
        }
        if ("SALES_ORDER".equals(tx.getReferenceType()) && tx.getReferenceId() != null) {
            SalesOrder so = orderMap.get(tx.getReferenceId());
            return so != null && so.getOrderCode() != null ? so.getOrderCode() : "HD-" + tx.getReferenceId();
        }
        if ("STOCK_ADJUSTMENT".equals(tx.getReferenceType())) {
            return "DC-" + tx.getId();
        }
        return "PK-" + tx.getId();
    }

    private LocalDateTime resolveVoucherDate(
            InventoryTransaction tx,
            Map<Long, StockImport> importMap,
            Map<Long, SalesOrder> orderMap
    ) {
        if ("STOCK_IMPORT".equals(tx.getReferenceType()) && tx.getReferenceId() != null) {
            StockImport si = importMap.get(tx.getReferenceId());
            if (si != null && si.getImportDate() != null) {
                return si.getImportDate();
            }
        }
        if ("SALES_ORDER".equals(tx.getReferenceType()) && tx.getReferenceId() != null) {
            SalesOrder so = orderMap.get(tx.getReferenceId());
            if (so != null && so.getCreatedAt() != null) {
                return so.getCreatedAt();
            }
        }
        return tx.getCreatedAt();
    }

    private String resolveDescription(InventoryTransaction tx, String voucherNo) {
        if (tx.getNote() != null && !tx.getNote().isBlank()) {
            return tx.getNote();
        }
        String type = tx.getTransactionType() != null ? tx.getTransactionType() : "";
        return switch (type) {
            case "STOCK_IN" -> "Nhập kho theo phiếu " + voucherNo;
            case "STOCK_OUT" -> "Xuất bán hàng theo đơn " + voucherNo;
            case "CANCEL_SALE" -> "Hoàn kho do hủy đơn " + voucherNo;
            case "ADJUSTMENT" -> "Điều chỉnh tồn kho sau kiểm kê";
            default -> "Biến động kho chứng từ " + voucherNo;
        };
    }

    private LocalDateTime parseDateTime(String input, boolean endOfDay, LocalDateTime defaultVal) {
        if (input == null || input.isBlank()) {
            return defaultVal;
        }
        String trimmed = input.trim();
        try {
            if (trimmed.contains("T")) {
                if (trimmed.endsWith("Z")) {
                    return java.time.Instant.parse(trimmed).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
                }
                return LocalDateTime.parse(trimmed);
            }
            if (trimmed.contains(" ")) {
                return LocalDateTime.parse(trimmed.replace(" ", "T"));
            }
            LocalDate date = LocalDate.parse(trimmed);
            return endOfDay ? date.atTime(23, 59, 59, 999999999) : date.atStartOfDay();
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Định dạng ngày không hợp lệ: " + input
                    + ". Hỗ trợ định dạng: yyyy-MM-dd hoặc yyyy-MM-ddTHH:mm:ss");
        }
    }
}
