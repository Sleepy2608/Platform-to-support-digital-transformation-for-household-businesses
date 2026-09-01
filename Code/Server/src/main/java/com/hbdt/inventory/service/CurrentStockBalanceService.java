package com.hbdt.inventory.service;

import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.Unit;
import com.hbdt.inventory.dto.CurrentStockBalanceResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.UnitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CurrentStockBalanceService {

    private static final String ACTIVE = "ACTIVE";
    private static final BigDecimal ZERO_QUANTITY = new BigDecimal("0.000");
    private static final BigDecimal ZERO_MONEY = new BigDecimal("0.00");

    private final BusinessContextService businessContextService;
    private final ProductRepository productRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;

    public CurrentStockBalanceService(
            BusinessContextService businessContextService,
            ProductRepository productRepository,
            InventoryBalanceRepository balanceRepository,
            CategoryRepository categoryRepository,
            UnitRepository unitRepository
    ) {
        this.businessContextService = businessContextService;
        this.productRepository = productRepository;
        this.balanceRepository = balanceRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
    }

    @Transactional(readOnly = true)
    public List<CurrentStockBalanceResponse> getCurrentBalances(String username) {
        Long businessId = businessContextService.requireBusinessId(username);
        List<Product> products = productRepository
                .findAllByBusinessIdAndStatusOrderByProductNameAsc(businessId, ACTIVE);

        Map<Long, InventoryBalance> balancesByProduct = balanceRepository
                .findAllByBusinessId(businessId).stream()
                .collect(Collectors.toMap(
                        InventoryBalance::getProductId,
                        Function.identity(),
                        (first, ignored) -> first));

        Map<Long, Category> categoriesById = loadCategories(businessId, products);
        Map<Long, Unit> unitsById = loadUnits(products);

        return products.stream()
                .map(product -> toResponse(
                        product,
                        balancesByProduct.get(product.getId()),
                        product.getCategoryId() == null
                                ? null
                                : categoriesById.get(product.getCategoryId()),
                        unitsById.get(product.getBaseUnitId())))
                .toList();
    }

    private Map<Long, Category> loadCategories(Long businessId, List<Product> products) {
        List<Long> categoryIds = products.stream()
                .map(Product::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (categoryIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Category> result = new HashMap<>();
        categoryRepository.findAllByBusinessIdAndIdIn(businessId, categoryIds)
                .forEach(category -> result.put(category.getId(), category));
        return result;
    }

    private Map<Long, Unit> loadUnits(List<Product> products) {
        List<Long> unitIds = products.stream()
                .map(Product::getBaseUnitId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (unitIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Unit> result = new HashMap<>();
        unitRepository.findAllById(unitIds)
                .forEach(unit -> result.put(unit.getId(), unit));
        return result;
    }

    private CurrentStockBalanceResponse toResponse(
            Product product,
            InventoryBalance balance,
            Category category,
            Unit baseUnit
    ) {
        return new CurrentStockBalanceResponse(
                product.getId(),
                product.getProductCode(),
                product.getProductName(),
                product.getCategoryId(),
                category == null ? null : category.getCategoryName(),
                product.getBaseUnitId(),
                baseUnit == null ? null : baseUnit.getUnitName(),
                balance == null ? ZERO_QUANTITY : balance.getQuantityOnHand(),
                balance == null ? ZERO_MONEY : balance.getAverageUnitCost(),
                balance == null ? ZERO_MONEY : balance.getInventoryValue(),
                balance == null ? null : balance.getUpdatedAt()
        );
    }
}
