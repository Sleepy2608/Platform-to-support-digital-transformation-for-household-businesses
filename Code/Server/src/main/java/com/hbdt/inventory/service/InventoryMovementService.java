package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.InventoryTransaction;
import com.hbdt.entity.Product;
import com.hbdt.entity.SalesOrder;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.inventory.dto.InventoryAdjustmentRequest;
import com.hbdt.inventory.dto.InventoryAdjustmentResponse;
import com.hbdt.inventory.dto.InventoryBalanceResponse;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.InventoryMovementResponse;
import com.hbdt.inventory.dto.InventoryTransactionFilterRequest;
import com.hbdt.inventory.dto.InventoryTransactionResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.InventoryTransactionRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.SalesOrderRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

@Service
public class InventoryMovementService {

    private static final int QUANTITY_SCALE = 3;
    private static final int MONEY_SCALE = 2;

    private final BusinessContextService businessContextService;
    private final UnitConversionService unitConversionService;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final LowStockAlertService lowStockAlertService;
    private final StockImportRepository stockImportRepository;
    private final SalesOrderRepository salesOrderRepository;

    public InventoryMovementService(
            BusinessContextService businessContextService,
            UnitConversionService unitConversionService,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            InventoryBalanceRepository balanceRepository,
            InventoryTransactionRepository transactionRepository,
            LowStockAlertService lowStockAlertService,
            StockImportRepository stockImportRepository,
            SalesOrderRepository salesOrderRepository
    ) {
        this.businessContextService = businessContextService;
        this.unitConversionService = unitConversionService;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.balanceRepository = balanceRepository;
        this.transactionRepository = transactionRepository;
        this.lowStockAlertService = lowStockAlertService;
        this.stockImportRepository = stockImportRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @Transactional(readOnly = true)
    public InventoryBalanceResponse getBalance(String actorUsername, Long productId) {
        Context context = requireContext(actorUsername, productId);
        InventoryBalance balance = balanceRepository
                .findByBusinessIdAndProductId(context.businessId(), productId)
                .orElseGet(() -> emptyBalance(context.businessId(), productId));
        Unit baseUnit = requireActiveUnit(context.product().getBaseUnitId());
        return new InventoryBalanceResponse(
                productId,
                baseUnit.getId(),
                baseUnit.getUnitName(),
                balance.getQuantityOnHand(),
                balance.getAverageUnitCost(),
                balance.getInventoryValue()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<InventoryTransactionResponse> getTransactions(
            String actorUsername,
            InventoryTransactionFilterRequest filter
    ) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);

        LocalDateTime fromDate = parseDateTime(filter.from(), false);
        LocalDateTime toDate = parseDateTime(filter.to(), true);

        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Thời gian 'from' không được lớn hơn 'to'");
        }

        Specification<InventoryTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Bắt buộc phân lập dữ liệu theo business_id (Tenant Isolation)
            predicates.add(cb.equal(root.get("businessId"), businessId));

            if (filter.productId() != null) {
                predicates.add(cb.equal(root.get("productId"), filter.productId()));
            }
            if (filter.transactionType() != null && !filter.transactionType().isBlank()) {
                predicates.add(cb.equal(root.get("transactionType"), filter.transactionType().trim()));
            }
            if (filter.referenceType() != null && !filter.referenceType().isBlank()) {
                predicates.add(cb.equal(root.get("referenceType"), filter.referenceType().trim()));
            }
            if (filter.referenceId() != null) {
                predicates.add(cb.equal(root.get("referenceId"), filter.referenceId()));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(
                filter.getResolvedPage(),
                filter.getResolvedSize(),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );

        Page<InventoryTransaction> pageResult = transactionRepository.findAll(spec, pageable);
        List<InventoryTransaction> transactions = pageResult.getContent();

        if (transactions.isEmpty()) {
            return new PageResponse<>(
                    List.of(),
                    pageResult.getNumber(),
                    pageResult.getSize(),
                    pageResult.getTotalElements(),
                    pageResult.getTotalPages(),
                    pageResult.isFirst(),
                    pageResult.isLast()
            );
        }

        // Batch loading: nạp Product, Unit, User, StockImport, SalesOrder để tránh N+1 queries
        List<Long> productIds = transactions.stream()
                .map(InventoryTransaction::getProductId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity(), (a, b) -> a));

        List<Long> unitIds = new ArrayList<>();
        transactions.forEach(tx -> {
            if (tx.getUnitId() != null) {
                unitIds.add(tx.getUnitId());
            }
        });
        productMap.values().forEach(p -> {
            if (p.getBaseUnitId() != null) {
                unitIds.add(p.getBaseUnitId());
            }
        });
        Map<Long, Unit> unitMap = unitRepository.findAllById(unitIds.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(Unit::getId, Function.identity(), (a, b) -> a));

        List<Long> userIds = transactions.stream()
                .map(InventoryTransaction::getCreatedBy)
                .filter(id -> id != null)
                .distinct()
                .toList();
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));

        // Batch-load chứng từ nguồn để resolve referenceCode
        List<Long> importIds = transactions.stream()
                .filter(tx -> "STOCK_IMPORT".equals(tx.getReferenceType()) && tx.getReferenceId() != null)
                .map(InventoryTransaction::getReferenceId)
                .distinct()
                .toList();
        Map<Long, StockImport> importMap = stockImportRepository.findAllById(importIds).stream()
                .collect(Collectors.toMap(StockImport::getId, Function.identity(), (a, b) -> a));

        List<Long> orderIds = transactions.stream()
                .filter(tx -> "SALES_ORDER".equals(tx.getReferenceType()) && tx.getReferenceId() != null)
                .map(InventoryTransaction::getReferenceId)
                .distinct()
                .toList();
        Map<Long, SalesOrder> orderMap = salesOrderRepository.findAllById(orderIds).stream()
                .collect(Collectors.toMap(SalesOrder::getId, Function.identity(), (a, b) -> a));

        Page<InventoryTransactionResponse> responsePage = pageResult.map(
                tx -> toTransactionResponse(tx, productMap, unitMap, userMap, importMap, orderMap));
        return PageResponse.from(responsePage);
    }

    private InventoryTransactionResponse toTransactionResponse(
            InventoryTransaction tx,
            Map<Long, Product> productMap,
            Map<Long, Unit> unitMap,
            Map<Long, User> userMap,
            Map<Long, StockImport> importMap,
            Map<Long, SalesOrder> orderMap
    ) {
        Product product = productMap.get(tx.getProductId());
        String productName = product != null ? product.getProductName() : "—";
        String productCode = product != null ? product.getProductCode() : "—";

        String unitName = null;
        if (tx.getUnitId() != null && unitMap.containsKey(tx.getUnitId())) {
            unitName = unitMap.get(tx.getUnitId()).getUnitName();
        } else if (product != null && product.getBaseUnitId() != null && unitMap.containsKey(product.getBaseUnitId())) {
            unitName = unitMap.get(product.getBaseUnitId()).getUnitName();
        }
        if (unitName == null) {
            unitName = "—";
        }

        String createdByName = "—";
        if (tx.getCreatedBy() != null) {
            User user = userMap.get(tx.getCreatedBy());
            if (user != null) {
                createdByName = user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getUsername();
            }
        } else {
            createdByName = "Hệ thống";
        }

        BigDecimal quantityBefore = (tx.getBalanceAfter() != null && tx.getQuantityChange() != null)
                ? tx.getBalanceAfter().subtract(tx.getQuantityChange())
                : null;

        BigDecimal baseQuantity = null;
        if (tx.getEnteredQuantity() != null && tx.getConversionRate() != null) {
            baseQuantity = tx.getEnteredQuantity().multiply(tx.getConversionRate()).setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
        } else if (tx.getQuantityChange() != null) {
            baseQuantity = tx.getQuantityChange().abs();
        }

        // Resolve mã chứng từ gốc để client không cần tự tra cứu theo referenceId
        String referenceCode = resolveReferenceCode(tx, importMap, orderMap);

        return InventoryTransactionResponse.builder()
                .transactionId(tx.getId())
                .productId(tx.getProductId())
                .productName(productName)
                .productCode(productCode)
                .transactionType(tx.getTransactionType())
                .referenceType(tx.getReferenceType())
                .referenceId(tx.getReferenceId())
                .referenceCode(referenceCode)
                .enteredQuantity(tx.getEnteredQuantity())
                .baseQuantity(baseQuantity)
                .quantityBefore(quantityBefore)
                .quantityChange(tx.getQuantityChange())
                .quantityAfter(tx.getBalanceAfter())
                .unitName(unitName)
                .unitCost(tx.getUnitCost())
                .transactionValue(tx.getTransactionValue())
                .note(tx.getNote())
                .createdByName(createdByName)
                .createdAt(tx.getCreatedAt())
                .build();
    }

    /**
     * Resolve mã chứng từ gốc từ referenceType và referenceId của một InventoryTransaction.
     * <ul>
     *   <li>STOCK_IMPORT → importCode của StockImport, fallback "NK-{id}"</li>
     *   <li>SALES_ORDER  → orderCode của SalesOrder, fallback "HD-{id}"</li>
     *   <li>STOCK_ADJUSTMENT → "ADJ-{txId}" (không có chứng từ riêng)</li>
     *   <li>null / unknown → null</li>
     * </ul>
     */
    private String resolveReferenceCode(
            InventoryTransaction tx,
            Map<Long, StockImport> importMap,
            Map<Long, SalesOrder> orderMap
    ) {
        String refType = tx.getReferenceType();
        if (refType == null) {
            return null;
        }
        return switch (refType) {
            case "STOCK_IMPORT" -> {
                if (tx.getReferenceId() == null) yield null;
                StockImport si = importMap.get(tx.getReferenceId());
                yield si != null && si.getImportCode() != null
                        ? si.getImportCode()
                        : "NK-" + tx.getReferenceId();
            }
            case "SALES_ORDER" -> {
                if (tx.getReferenceId() == null) yield null;
                SalesOrder so = orderMap.get(tx.getReferenceId());
                yield so != null && so.getOrderCode() != null
                        ? so.getOrderCode()
                        : "HD-" + tx.getReferenceId();
            }
            case "STOCK_ADJUSTMENT" -> "ADJ-" + tx.getId();
            default -> null;
        };
    }

    private LocalDateTime parseDateTime(String input, boolean endOfDay) {
        if (input == null || input.isBlank()) {
            return null;
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

    @Transactional
    public InventoryMovementResponse stockIn(String actorUsername, InventoryMovementRequest request) {
        if (request.getUnitCost() == null) {
            throw new BadRequestException("Đơn giá nhập không được để trống");
        }
        Context context = requireContext(actorUsername, request.getProductId());
        if (request.getReferenceId() != null) {
            boolean exists = transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                    context.businessId(), request.getProductId(), "STOCK_IMPORT", request.getReferenceId(), "STOCK_IN");
            if (exists) {
                throw new BadRequestException("Giao dịch nhập kho cho phiếu nhập #" + request.getReferenceId()
                        + " và sản phẩm #" + request.getProductId() + " đã tồn tại");
            }
        }
        Conversion conversion = convertToBase(actorUsername, request, context.product());
        InventoryBalance balance = lockOrCreateBalance(context.businessId(), request.getProductId());

        BigDecimal transactionValue = request.getQuantity()
                .multiply(request.getUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal balanceAfter = balance.getQuantityOnHand().add(conversion.baseQuantity());
        BigDecimal inventoryValue = balance.getInventoryValue().add(transactionValue)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal averageCost = balanceAfter.signum() == 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE)
                : inventoryValue.divide(balanceAfter, MONEY_SCALE, RoundingMode.HALF_UP);

        updateBalance(balance, balanceAfter, averageCost, inventoryValue);
        InventoryTransaction transaction = saveTransaction(
                context, request, conversion, "STOCK_IN", "STOCK_IMPORT",
                conversion.baseQuantity(), balanceAfter, averageCost,
                transactionValue, inventoryValue
        );
        lowStockAlertService.evaluate(context.businessId(), request.getProductId(), balanceAfter);
        return toResponse(transaction, request, conversion, context.product(), balance);
    }

    @Transactional
    public InventoryMovementResponse stockOut(String actorUsername, InventoryMovementRequest request) {
        Context context = requireContext(actorUsername, request.getProductId());
        if (request.getReferenceId() != null) {
            boolean exists = transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                    context.businessId(), request.getProductId(), "SALES_ORDER", request.getReferenceId(), "STOCK_OUT");
            if (exists) {
                throw new BadRequestException("Giao dịch xuất kho cho đơn hàng #" + request.getReferenceId()
                        + " và sản phẩm #" + request.getProductId() + " đã tồn tại");
            }
        }
        Conversion conversion = convertToBase(actorUsername, request, context.product());
        InventoryBalance balance = balanceRepository
                .findForUpdate(context.businessId(), request.getProductId())
                .orElseThrow(() -> new BadRequestException("Sản phẩm chưa có tồn kho"));
        if (balance.getQuantityOnHand().compareTo(conversion.baseQuantity()) < 0) {
            throw new BadRequestException("Số lượng xuất vượt quá số lượng tồn kho");
        }

        BigDecimal balanceAfter = balance.getQuantityOnHand().subtract(conversion.baseQuantity());
        BigDecimal transactionValue = conversion.baseQuantity()
                .multiply(balance.getAverageUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal inventoryValue = balanceAfter
                .multiply(balance.getAverageUnitCost())
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        updateBalance(balance, balanceAfter, balance.getAverageUnitCost(), inventoryValue);
        InventoryTransaction transaction = saveTransaction(
                context, request, conversion, "STOCK_OUT", "SALES_ORDER",
                conversion.baseQuantity().negate(), balanceAfter, balance.getAverageUnitCost(),
                transactionValue, inventoryValue
        );
        lowStockAlertService.evaluate(context.businessId(), request.getProductId(), balanceAfter);
        return toResponse(transaction, request, conversion, context.product(), balance);
    }

    @Transactional
    public void restoreCancelledSale(
            String actorUsername,
            Long productId,
            BigDecimal baseQuantity,
            Long salesOrderId,
            String orderCode
    ) {
        if (baseQuantity == null || baseQuantity.signum() <= 0) {
            throw new BadRequestException("Số lượng hoàn kho phải lớn hơn 0");
        }
        Context context = requireContext(actorUsername, productId);
        boolean alreadyRestored = transactionRepository.existsByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndTransactionType(
                context.businessId(), productId, "SALES_ORDER", salesOrderId, "CANCEL_SALE");
        if (alreadyRestored) {
            throw new BadRequestException("Đơn hàng #" + orderCode + " đã được hoàn kho trước đó");
        }

        InventoryBalance balance = lockOrCreateBalance(context.businessId(), productId);
        InventoryTransaction originalSale = transactionRepository
                .findFirstByBusinessIdAndProductIdAndReferenceTypeAndReferenceIdAndQuantityChangeLessThanOrderByIdDesc(
                        context.businessId(), productId, "SALES_ORDER", salesOrderId, BigDecimal.ZERO)
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy giao dịch xuất kho gốc của đơn hàng"));

        BigDecimal unitCost = originalSale.getUnitCost() == null
                ? BigDecimal.ZERO.setScale(MONEY_SCALE)
                : originalSale.getUnitCost();
        BigDecimal transactionValue = baseQuantity.multiply(unitCost)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal balanceAfter = balance.getQuantityOnHand().add(baseQuantity);
        BigDecimal inventoryValue = balance.getInventoryValue().add(transactionValue)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal averageCost = balanceAfter.signum() == 0
                ? BigDecimal.ZERO.setScale(MONEY_SCALE)
                : inventoryValue.divide(balanceAfter, MONEY_SCALE, RoundingMode.HALF_UP);
        updateBalance(balance, balanceAfter, averageCost, inventoryValue);

        transactionRepository.save(InventoryTransaction.builder()
                .businessId(context.businessId())
                .productId(productId)
                .unitId(context.product().getBaseUnitId())
                .enteredQuantity(baseQuantity)
                .conversionRate(BigDecimal.ONE)
                .createdBy(context.actorId())
                .transactionType("CANCEL_SALE")
                .referenceType("SALES_ORDER")
                .referenceId(salesOrderId)
                .quantityChange(baseQuantity)
                .balanceAfter(balanceAfter)
                .unitCost(unitCost)
                .transactionValue(transactionValue)
                .balanceValue(inventoryValue)
                .costStatus("COMPLETED")
                .costedAt(LocalDateTime.now())
                .note("Hoàn kho do hủy đơn " + orderCode)
                .build());
        lowStockAlertService.evaluate(context.businessId(), productId, balanceAfter);
    }

    @Transactional
    public InventoryAdjustmentResponse adjustStock(String actorUsername, InventoryAdjustmentRequest request) {
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BadRequestException("Lý do điều chỉnh không được để trống");
        }
        Context context = requireContext(actorUsername, request.getProductId());
        Unit enteredUnit = requireActiveUnit(request.getUnitId());
        validateQuantityForUnit(request.getQuantity(), enteredUnit);
        Unit baseUnit = requireActiveUnit(context.product().getBaseUnitId());

        BigDecimal rate = unitConversionService.getConversionRate(
                actorUsername, context.product().getId(), request.getUnitId());
        BigDecimal convertedBaseQuantity = unitConversionService.toBaseQuantity(
                actorUsername, context.product().getId(), request.getUnitId(), request.getQuantity());

        InventoryBalance balance = lockOrCreateBalance(context.businessId(), request.getProductId());
        BigDecimal balanceBefore = balance.getQuantityOnHand();
        BigDecimal balanceAfter;
        BigDecimal quantityChange;

        String adjType = request.getAdjustmentType() == null || request.getAdjustmentType().isBlank()
                ? "SET"
                : request.getAdjustmentType().trim().toUpperCase();

        switch (adjType) {
            case "INCREASE" -> {
                quantityChange = convertedBaseQuantity;
                balanceAfter = balanceBefore.add(quantityChange);
            }
            case "DECREASE" -> {
                quantityChange = convertedBaseQuantity.negate();
                balanceAfter = balanceBefore.subtract(convertedBaseQuantity);
                if (balanceAfter.signum() < 0) {
                    throw new BadRequestException("Số lượng giảm (" + convertedBaseQuantity
                            + ") vượt quá số lượng tồn hiện tại (" + balanceBefore + ")");
                }
            }
            case "SET" -> {
                balanceAfter = convertedBaseQuantity;
                quantityChange = balanceAfter.subtract(balanceBefore);
                if (balanceAfter.signum() < 0) {
                    throw new BadRequestException("Số lượng tồn kho sau kiểm kê không được âm");
                }
            }
            default -> throw new BadRequestException("Loại điều chỉnh không hợp lệ: " + adjType
                    + ". Hỗ trợ: SET, INCREASE, DECREASE");
        }

        BigDecimal unitCost = balance.getAverageUnitCost() != null
                ? balance.getAverageUnitCost()
                : BigDecimal.ZERO.setScale(MONEY_SCALE);
        BigDecimal transactionValue = quantityChange.abs()
                .multiply(unitCost)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal inventoryValue = balanceAfter
                .multiply(unitCost)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        updateBalance(balance, balanceAfter, unitCost, inventoryValue);

        String note = String.format("[Kiểm kê] Trước: %s %s, Sau: %s %s (Lệch: %s%s). Lý do: %s",
                balanceBefore.stripTrailingZeros().toPlainString(), baseUnit.getUnitName(),
                balanceAfter.stripTrailingZeros().toPlainString(), baseUnit.getUnitName(),
                quantityChange.signum() >= 0 ? "+" : "",
                quantityChange.stripTrailingZeros().toPlainString(),
                request.getReason().trim());

        LocalDateTime now = LocalDateTime.now();
        InventoryTransaction transaction = transactionRepository.save(InventoryTransaction.builder()
                .businessId(context.businessId())
                .productId(context.product().getId())
                .unitId(enteredUnit.getId())
                .enteredQuantity(request.getQuantity())
                .conversionRate(rate)
                .createdBy(context.actorId())
                .transactionType("ADJUSTMENT")
                .referenceType("STOCK_ADJUSTMENT")
                .referenceId(null)
                .quantityChange(quantityChange.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP))
                .balanceAfter(balanceAfter.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP))
                .unitCost(unitCost)
                .transactionValue(transactionValue)
                .balanceValue(inventoryValue)
                .costStatus("COMPLETED")
                .costedAt(now)
                .note(note)
                .createdAt(now)
                .build());

        lowStockAlertService.evaluate(context.businessId(), request.getProductId(), balanceAfter);

        return InventoryAdjustmentResponse.builder()
                .transactionId(transaction.getId())
                .productId(context.product().getId())
                .productName(context.product().getProductName())
                .productCode(context.product().getProductCode())
                .enteredUnitId(enteredUnit.getId())
                .enteredUnitName(enteredUnit.getUnitName())
                .enteredQuantity(request.getQuantity())
                .conversionRate(rate)
                .baseUnitId(baseUnit.getId())
                .baseUnitName(baseUnit.getUnitName())
                .baseQuantity(convertedBaseQuantity)
                .quantityChange(quantityChange.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP))
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP))
                .unitCost(unitCost)
                .transactionValue(transactionValue)
                .balanceValue(inventoryValue)
                .adjustmentType(adjType)
                .reason(request.getReason().trim())
                .adjustedById(context.actorId())
                .adjustedByUsername(actorUsername)
                .adjustedAt(now)
                .build();
    }

    private Context requireContext(String actorUsername, Long productId) {
        Long businessId = businessContextService.requireBusinessId(actorUsername);
        Product product = productRepository.findByIdAndBusinessId(productId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        return new Context(businessId, product, actor.getId());
    }

    private Conversion convertToBase(
            String actorUsername,
            InventoryMovementRequest request,
            Product product
    ) {
        Unit enteredUnit = requireActiveUnit(request.getUnitId());
        validateQuantityForUnit(request.getQuantity(), enteredUnit);
        Unit baseUnit = requireActiveUnit(product.getBaseUnitId());
        BigDecimal rate = unitConversionService.getConversionRate(
                actorUsername, product.getId(), request.getUnitId()
        );
        BigDecimal baseQuantity = unitConversionService.toBaseQuantity(
                actorUsername, product.getId(), request.getUnitId(), request.getQuantity()
        );
        return new Conversion(rate, baseQuantity, enteredUnit, baseUnit);
    }

    private void validateQuantityForUnit(BigDecimal quantity, Unit unit) {
        String unitCode = unit.getUnitCode() == null ? "" : unit.getUnitCode().trim().toUpperCase();
        boolean allowsFraction = "KG".equals(unitCode) || "LIT".equals(unitCode);
        if (!allowsFraction && quantity.stripTrailingZeros().scale() > 0) {
            throw new BadRequestException("Chỉ đơn vị kg và lít được phép nhập số lượng thập phân");
        }
    }

    private Unit requireActiveUnit(Long unitId) {
        return unitRepository.findByIdAndStatus(unitId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn vị tính"));
    }

    private InventoryBalance lockOrCreateBalance(Long businessId, Long productId) {
        Optional<InventoryBalance> existing = balanceRepository.findForUpdate(businessId, productId);
        if (existing.isPresent()) {
            return existing.get();
        }
        try {
            return balanceRepository.save(emptyBalance(businessId, productId));
        } catch (Exception ex) {
            return balanceRepository.findForUpdate(businessId, productId)
                    .orElseThrow(() -> new IllegalStateException(
                            "Không thể khởi tạo hoặc khóa số dư kho cho sản phẩm #" + productId, ex));
        }
    }

    private InventoryBalance emptyBalance(Long businessId, Long productId) {
        return InventoryBalance.builder()
                .businessId(businessId)
                .productId(productId)
                .quantityOnHand(BigDecimal.ZERO.setScale(QUANTITY_SCALE))
                .averageUnitCost(BigDecimal.ZERO.setScale(MONEY_SCALE))
                .inventoryValue(BigDecimal.ZERO.setScale(MONEY_SCALE))
                .build();
    }

    private void updateBalance(
            InventoryBalance balance,
            BigDecimal quantity,
            BigDecimal averageCost,
            BigDecimal inventoryValue
    ) {
        balance.setQuantityOnHand(quantity.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP));
        balance.setAverageUnitCost(averageCost.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        balance.setInventoryValue(inventoryValue.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        balanceRepository.save(balance);
    }

    private InventoryTransaction saveTransaction(
            Context context,
            InventoryMovementRequest request,
            Conversion conversion,
            String transactionType,
            String referenceType,
            BigDecimal quantityChange,
            BigDecimal balanceAfter,
            BigDecimal unitCost,
            BigDecimal transactionValue,
            BigDecimal balanceValue
    ) {
        return transactionRepository.save(InventoryTransaction.builder()
                .businessId(context.businessId())
                .productId(context.product().getId())
                .unitId(request.getUnitId())
                .enteredQuantity(request.getQuantity())
                .conversionRate(conversion.rate())
                .createdBy(context.actorId())
                .transactionType(transactionType)
                .referenceType(referenceType)
                .referenceId(request.getReferenceId())
                .quantityChange(quantityChange)
                .balanceAfter(balanceAfter)
                .unitCost(unitCost)
                .transactionValue(transactionValue)
                .balanceValue(balanceValue)
                .costStatus("COSTED")
                .costedAt(LocalDateTime.now())
                .note(request.getNote())
                .build());
    }

    private InventoryMovementResponse toResponse(
            InventoryTransaction transaction,
            InventoryMovementRequest request,
            Conversion conversion,
            Product product,
            InventoryBalance balance
    ) {
        return new InventoryMovementResponse(
                transaction.getId(),
                product.getId(),
                conversion.enteredUnit().getId(),
                conversion.enteredUnit().getUnitName(),
                request.getQuantity(),
                conversion.rate(),
                conversion.baseUnit().getId(),
                conversion.baseUnit().getUnitName(),
                conversion.baseQuantity(),
                balance.getQuantityOnHand(),
                balance.getAverageUnitCost(),
                balance.getInventoryValue(),
                transaction.getTransactionType()
        );
    }

    private record Context(Long businessId, Product product, Long actorId) {
    }

    private record Conversion(
            BigDecimal rate,
            BigDecimal baseQuantity,
            Unit enteredUnit,
            Unit baseUnit
    ) {
    }
}
