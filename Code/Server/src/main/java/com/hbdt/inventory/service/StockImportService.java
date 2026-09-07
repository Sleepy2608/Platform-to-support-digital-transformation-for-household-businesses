package com.hbdt.inventory.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Product;
import com.hbdt.entity.StockImport;
import com.hbdt.entity.StockImportItem;
import com.hbdt.entity.Unit;
import com.hbdt.entity.User;
import com.hbdt.inventory.dto.InventoryMovementRequest;
import com.hbdt.inventory.dto.StockImportItemRequest;
import com.hbdt.inventory.dto.StockImportItemResponse;
import com.hbdt.inventory.dto.StockImportPageResponse;
import com.hbdt.inventory.dto.StockImportRequest;
import com.hbdt.inventory.dto.StockImportResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.product.service.UnitConversionService;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.StockImportItemRepository;
import com.hbdt.repository.StockImportRepository;
import com.hbdt.repository.UnitRepository;
import com.hbdt.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service xử lý nghiệp vụ phiếu nhập kho.
 * Luồng: Draft → Confirm (cập nhật tồn kho + lưu lịch sử biến động).
 */
@Service
public class StockImportService {

    private static final Logger logger = LoggerFactory.getLogger(StockImportService.class);
    private static final String DRAFT = "DRAFT";
    private static final String CONFIRMED = "CONFIRMED";
    private static final int QUANTITY_SCALE = 3;
    private static final int MONEY_SCALE = 2;
    private static final DateTimeFormatter CODE_DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final StockImportRepository stockImportRepository;
    private final StockImportItemRepository stockImportItemRepository;
    private final ProductRepository productRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final BusinessContextService businessContextService;
    private final UnitConversionService unitConversionService;
    private final InventoryMovementService inventoryMovementService;

    public StockImportService(
            StockImportRepository stockImportRepository,
            StockImportItemRepository stockImportItemRepository,
            ProductRepository productRepository,
            UnitRepository unitRepository,
            UserRepository userRepository,
            BusinessContextService businessContextService,
            UnitConversionService unitConversionService,
            InventoryMovementService inventoryMovementService
    ) {
        this.stockImportRepository = stockImportRepository;
        this.stockImportItemRepository = stockImportItemRepository;
        this.productRepository = productRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.businessContextService = businessContextService;
        this.unitConversionService = unitConversionService;
        this.inventoryMovementService = inventoryMovementService;
    }

    /**
     * Tạo phiếu nhập kho mới (status = DRAFT, chưa cập nhật tồn kho).
     */
    @Transactional
    public StockImportResponse create(String username, StockImportRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        // Sinh mã phiếu: NK-yyyyMMdd-xxx
        String importCode = generateImportCode(businessId);

        // Validate & build danh sách items
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<StockImportItem> items = new ArrayList<>();

        for (StockImportItemRequest itemReq : request.items()) {
            Product product = productRepository.findByIdAndBusinessId(itemReq.productId(), businessId)
                    .orElseThrow(() -> new BadRequestException("Sản phẩm không tồn tại hoặc không thuộc cửa hàng"));

            // Tính tỷ lệ quy đổi ĐVT
            BigDecimal conversionRate = unitConversionService.getConversionRate(
                    username, product.getId(), itemReq.unitId());
            BigDecimal baseQuantity = itemReq.quantity()
                    .multiply(conversionRate)
                    .setScale(QUANTITY_SCALE, RoundingMode.HALF_UP);
            BigDecimal lineTotal = itemReq.quantity()
                    .multiply(itemReq.purchasePrice())
                    .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            items.add(StockImportItem.builder()
                    .productId(product.getId())
                    .unitId(itemReq.unitId())
                    .quantity(itemReq.quantity())
                    .conversionRate(conversionRate)
                    .baseQuantity(baseQuantity)
                    .purchasePrice(itemReq.purchasePrice())
                    .lineTotal(lineTotal)
                    .build());
        }

        // Lưu phiếu nhập
        StockImport stockImport = stockImportRepository.save(StockImport.builder()
                .businessId(businessId)
                .createdBy(user.getId())
                .importCode(importCode)
                .totalAmount(totalAmount)
                .status(DRAFT)
                .note(request.note())
                .build());

        // Lưu danh sách items
        for (StockImportItem item : items) {
            item.setStockImportId(stockImport.getId());
        }
        stockImportItemRepository.saveAll(items);

        logger.info("Tạo phiếu nhập kho {}: businessId={}, items={}", importCode, businessId, items.size());
        return toResponse(stockImport, items, user.getFullName());
    }

    /**
     * Xem chi tiết phiếu nhập kho.
     */
    @Transactional(readOnly = true)
    public StockImportResponse getDetail(String username, Long importId) {
        Long businessId = businessContextService.requireBusinessId(username);
        StockImport stockImport = stockImportRepository.findByIdAndBusinessId(importId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập kho"));
        List<StockImportItem> items = stockImportItemRepository.findAllByStockImportId(importId);
        String createdByName = userRepository.findById(stockImport.getCreatedBy())
                .map(User::getFullName).orElse("—");
        return toResponse(stockImport, items, createdByName);
    }

    /**
     * Tìm kiếm phân trang lịch sử phiếu nhập kho.
     */
    @Transactional(readOnly = true)
    public StockImportPageResponse search(String username, String keyword, int page, int size) {
        Long businessId = businessContextService.requireBusinessId(username);
        PageRequest pageable = PageRequest.of(page, Math.min(size, 50));

        Page<StockImport> result = (keyword != null && !keyword.isBlank())
                ? stockImportRepository.searchByBusinessIdAndKeyword(businessId, keyword.trim(), pageable)
                : stockImportRepository.findAllByBusinessIdOrderByImportDateDesc(businessId, pageable);

        List<StockImportResponse> content = result.getContent().stream()
                .map(si -> {
                    List<StockImportItem> items = stockImportItemRepository.findAllByStockImportId(si.getId());
                    String createdByName = userRepository.findById(si.getCreatedBy())
                            .map(User::getFullName).orElse("—");
                    return toResponse(si, items, createdByName);
                })
                .toList();

        return new StockImportPageResponse(
                content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(),
                result.isFirst(), result.isLast()
        );
    }

    /**
     * Xác nhận phiếu nhập kho (DRAFT → CONFIRMED).
     * Cập nhật tồn kho theo chuẩn quy đổi ĐVT.
     * Ràng buộc Idempotency: Block confirm nhiều lần trên cùng phiếu.
     */
    @Transactional
    public StockImportResponse confirm(String username, Long importId) {
        Long businessId = businessContextService.requireBusinessId(username);
        StockImport stockImport = stockImportRepository.findByIdAndBusinessId(importId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập kho"));

        // Idempotency check: chặn confirm lần 2+
        if (!DRAFT.equals(stockImport.getStatus())) {
            throw new BadRequestException("Phiếu đã được xác nhận, không thể cập nhật tồn kho lần nữa");
        }

        List<StockImportItem> items = stockImportItemRepository.findAllByStockImportId(importId);
        if (items.isEmpty()) {
            throw new BadRequestException("Phiếu nhập kho không có sản phẩm nào");
        }

        // Duyệt từng item, gọi InventoryMovementService.stockIn() để tăng tồn kho
        for (StockImportItem item : items) {
            InventoryMovementRequest movementReq = new InventoryMovementRequest();
            movementReq.setProductId(item.getProductId());
            movementReq.setUnitId(item.getUnitId());
            movementReq.setQuantity(item.getQuantity());
            movementReq.setUnitCost(item.getPurchasePrice());
            movementReq.setReferenceId(stockImport.getId());
            movementReq.setNote("Nhập kho từ phiếu " + stockImport.getImportCode());
            inventoryMovementService.stockIn(username, movementReq);
        }

        // Cập nhật trạng thái
        stockImport.setStatus(CONFIRMED);
        stockImportRepository.save(stockImport);

        String createdByName = userRepository.findById(stockImport.getCreatedBy())
                .map(User::getFullName).orElse("—");
        logger.info("Xác nhận phiếu nhập kho {}: businessId={}, items={}", stockImport.getImportCode(), businessId, items.size());
        return toResponse(stockImport, items, createdByName);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    /** Sinh mã phiếu nhập: NK-yyyyMMdd-001, NK-yyyyMMdd-002... */
    private String generateImportCode(Long businessId) {
        String dateStr = LocalDate.now().format(CODE_DATE_FMT);
        long count = stockImportRepository.countByBusinessId(businessId);
        return String.format("NK-%s-%03d", dateStr, count + 1);
    }

    /** Chuyển đổi entity → response DTO. */
    private StockImportResponse toResponse(StockImport si, List<StockImportItem> items, String createdByName) {
        List<StockImportItemResponse> itemResponses = items.stream().map(item -> {
            String productName = productRepository.findById(item.getProductId())
                    .map(Product::getProductName).orElse("—");
            String productCode = productRepository.findById(item.getProductId())
                    .map(Product::getProductCode).orElse("—");
            String unitName = unitRepository.findById(item.getUnitId())
                    .map(Unit::getUnitName).orElse("—");
            return new StockImportItemResponse(
                    item.getId(), item.getProductId(), productName, productCode,
                    item.getUnitId(), unitName, item.getQuantity(),
                    item.getConversionRate(), item.getBaseQuantity(),
                    item.getPurchasePrice(), item.getLineTotal()
            );
        }).toList();

        return new StockImportResponse(
                si.getId(), si.getImportCode(), si.getImportDate(),
                si.getStatus(), si.getTotalAmount(), si.getNote(),
                si.getCreatedBy(), createdByName, si.getCreatedAt(), itemResponses
        );
    }
}
