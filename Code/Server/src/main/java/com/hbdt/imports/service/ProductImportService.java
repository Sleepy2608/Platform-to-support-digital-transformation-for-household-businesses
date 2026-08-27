package com.hbdt.imports.service;

import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.imports.dto.*;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Service for handling product bulk import from Excel and CSV files
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final ProductImportFileParser fileParser;
    private final ProductImportErrorReportGenerator errorReportGenerator;

    /**
     * Process product import from file
     */
    @Transactional
    public ProductImportResponse importProducts(Long businessId, byte[] fileBytes, String fileName) {
        log.info("Starting product import for businessId: {}, file: {}", businessId, fileName);

        // 1. Parse file
        List<ProductImportRequest> rows;
        try {
            rows = fileParser.parseFile(fileBytes, fileName);
        } catch (Exception e) {
            log.error("Failed to parse file: {}", e.getMessage());
            return ProductImportResponse.failed("Không thể đọc tệp: " + e.getMessage());
        }

        if (rows.isEmpty()) {
            return ProductImportResponse.failed("Tệp không chứa dữ liệu hợp lệ");
        }

        // 2. Validate all rows
        ProductImportResult result = validateAndPrepareProducts(businessId, rows);

        // 3. Save valid products
        if (!result.getSuccessfulRows().isEmpty()) {
            saveProducts(businessId, result.getSuccessfulRows());
        }

        log.info("Product import completed: {} success, {} errors", result.getSuccessCount(), result.getErrorCount());

        // 4. Return result
        if (result.hasErrors()) {
            return ProductImportResponse.partial(
                    result.getTotalRows(), result.getSuccessCount(), result.getSkipCount(), result.getErrors());
        }
        return ProductImportResponse.success(result.getTotalRows(), result.getSuccessCount(), result.getSkipCount());
    }

    /**
     * Validate and prepare products for import
     */
    private ProductImportResult validateAndPrepareProducts(Long businessId, List<ProductImportRequest> rows) {
        ProductImportResult result = ProductImportResult.empty();
        result.setTotalRows(rows.size());

        // Pre-load lookup data
        Map<String, Category> categoryMap = loadCategories(businessId);
        Map<String, Unit> unitMap = loadUnits();
        Set<String> usedCodes = new HashSet<>();

        for (int i = 0; i < rows.size(); i++) {
            int rowNumber = i + 1;
            ProductImportRequest row = rows.get(i);
            boolean rowValid = true;

            // Validate product code
            if (row.getProductCode() == null || row.getProductCode().trim().isEmpty()) {
                result.addError(rowNumber, "productCode", null, "Mã sản phẩm không được để trống");
                rowValid = false;
            } else {
                String code = row.getProductCode().trim().toUpperCase();
                if (usedCodes.contains(code)) {
                    result.addError(rowNumber, "productCode", code, "Mã sản phẩm bị trùng trong tệp nhập dữ liệu");
                    rowValid = false;
                }
                usedCodes.add(code);
                if (productRepository.existsByBusinessIdAndProductCodeIgnoreCase(businessId, code)) {
                    result.addError(rowNumber, "productCode", code, "Mã sản phẩm đã tồn tại trong hệ thống");
                    rowValid = false;
                }
            }

            // Validate product name
            if (row.getProductName() == null || row.getProductName().trim().isEmpty()) {
                result.addError(rowNumber, "productName", null, "Tên sản phẩm không được để trống");
                rowValid = false;
            }

            // Validate unit (required)
            if (row.getBaseUnitCode() == null || row.getBaseUnitCode().trim().isEmpty()) {
                result.addError(rowNumber, "baseUnitCode", null, "Mã đơn vị tính không được để trống");
                rowValid = false;
            } else {
                String unitCode = row.getBaseUnitCode().trim().toUpperCase();
                if (!unitMap.containsKey(unitCode)) {
                    result.addError(rowNumber, "baseUnitCode", unitCode, "Đơn vị tính không tồn tại trong hệ thống");
                    rowValid = false;
                }
            }

            // Validate category (optional but must be valid if provided)
            if (row.getCategoryCode() != null && !row.getCategoryCode().trim().isEmpty()) {
                String catCode = row.getCategoryCode().trim().toUpperCase();
                if (!categoryMap.containsKey(catCode)) {
                    result.addError(rowNumber, "categoryCode", catCode, "Danh mục không tồn tại trong hệ thống");
                    rowValid = false;
                }
            }

            // Validate price >= 0
            if (row.getSalePrice() != null && row.getSalePrice().compareTo(BigDecimal.ZERO) < 0) {
                result.addError(rowNumber, "salePrice", row.getSalePrice().toString(), "Giá bán không được âm");
                rowValid = false;
            }

            // Validate quantity >= 0
            if (row.getQuantityOnHand() != null && row.getQuantityOnHand().compareTo(BigDecimal.ZERO) < 0) {
                result.addError(rowNumber, "quantityOnHand", row.getQuantityOnHand().toString(), "Tồn kho không được âm");
                rowValid = false;
            }

            // Validate status
            if (row.getStatus() != null && !row.getStatus().trim().isEmpty()) {
                String status = row.getStatus().trim().toUpperCase();
                if (!status.equals("ACTIVE") && !status.equals("INACTIVE")) {
                    result.addError(rowNumber, "status", status, "Trạng thái phải là ACTIVE hoặc INACTIVE");
                    rowValid = false;
                }
            }

            if (rowValid) {
                normalizeRow(row);
                result.addSuccess(row);
            }
        }

        return result;
    }

    /**
     * Normalize row data before saving
     */
    private void normalizeRow(ProductImportRequest row) {
        if (row.getProductCode() != null) row.setProductCode(row.getProductCode().trim().toUpperCase());
        if (row.getProductName() != null) row.setProductName(row.getProductName().trim());
        if (row.getBaseUnitCode() != null) row.setBaseUnitCode(row.getBaseUnitCode().trim().toUpperCase());
        if (row.getCategoryCode() != null && !row.getCategoryCode().trim().isEmpty()) {
            row.setCategoryCode(row.getCategoryCode().trim().toUpperCase());
        } else {
            row.setCategoryCode(null);
        }
        if (row.getStatus() == null || row.getStatus().trim().isEmpty()) {
            row.setStatus("ACTIVE");
        } else {
            row.setStatus(row.getStatus().trim().toUpperCase());
        }
        if (row.getSalePrice() == null) row.setSalePrice(BigDecimal.ZERO);
        if (row.getQuantityOnHand() == null) row.setQuantityOnHand(BigDecimal.ZERO);
    }

    /**
     * Save products to database
     */
    private void saveProducts(Long businessId, List<ProductImportRequest> validRows) {
        Map<String, Category> categoryMap = loadCategories(businessId);
        Map<String, Unit> unitMap = loadUnits();

        List<Product> products = new ArrayList<>();
        List<InventoryBalance> inventoryBalances = new ArrayList<>();

        for (ProductImportRequest row : validRows) {
            Product product = Product.builder()
                    .businessId(businessId)
                    .productCode(row.getProductCode())
                    .productName(row.getProductName())
                    .salePrice(row.getSalePrice())
                    .description(row.getDescription())
                    .status(row.getStatus())
                    .build();

            // Set category
            if (row.getCategoryCode() != null) {
                Category category = categoryMap.get(row.getCategoryCode());
                if (category != null) product.setCategoryId(category.getId());
            }

            // Set unit
            Unit unit = unitMap.get(row.getBaseUnitCode());
            if (unit != null) product.setBaseUnitId(unit.getId());

            products.add(product);
        }

        // Batch save products
        products = productRepository.saveAll(products);
        log.info("Saved {} products", products.size());

        // Create inventory balances
        for (int i = 0; i < products.size(); i++) {
            Product product = products.get(i);
            ProductImportRequest row = validRows.get(i);

            if (row.getQuantityOnHand() != null && row.getQuantityOnHand().compareTo(BigDecimal.ZERO) > 0) {
                InventoryBalance balance = InventoryBalance.builder()
                        .businessId(businessId)
                        .productId(product.getId())
                        .quantityOnHand(row.getQuantityOnHand())
                        .averageUnitCost(BigDecimal.ZERO)
                        .inventoryValue(BigDecimal.ZERO)
                        .build();
                inventoryBalances.add(balance);
            }
        }

        if (!inventoryBalances.isEmpty()) {
            inventoryBalanceRepository.saveAll(inventoryBalances);
            log.info("Created {} inventory balances", inventoryBalances.size());
        }
    }

    private Map<String, Category> loadCategories(Long businessId) {
        Map<String, Category> map = new HashMap<>();
        categoryRepository.findAll().stream()
                .filter(c -> c.getBusinessId().equals(businessId))
                .forEach(c -> map.put(c.getCategoryCode().toUpperCase(), c));
        return map;
    }

    private Map<String, Unit> loadUnits() {
        Map<String, Unit> map = new HashMap<>();
        unitRepository.findAll().forEach(u -> map.put(u.getUnitCode().toUpperCase(), u));
        return map;
    }

    /**
     * Get template file for download
     */
    public byte[] getTemplateFile() {
        return fileParser.generateTemplate();
    }

    /**
     * Generate error report for download
     */
    public byte[] generateErrorReport(List<ProductImportRowError> errors) {
        return errorReportGenerator.generateErrorReportBytes(errors);
    }
}
