package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entity.Category;
import com.hbdt.entity.InventoryBalance;
import com.hbdt.entity.Product;
import com.hbdt.entity.ProductUnit;
import com.hbdt.entity.TaxActivityGroup;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.product.dto.ProductImageResponse;
import com.hbdt.product.dto.ProductRequest;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ReferenceOption;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.InventoryBalanceRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.ProductUnitRepository;
import com.hbdt.repository.TaxActivityGroupRepository;
import com.hbdt.repository.UnitRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";
    private static final String DEFAULT_UNIT_CODE = "SAN_PHAM";
    private static final String DEFAULT_UNIT_NAME = "Sản phẩm";
    private static final BigDecimal MAX_PRODUCT_QUANTITY = new BigDecimal("999999999999999");
    private static final Set<String> SORTABLE_FIELDS = Set.of("productCode", "productName", "status", "createdAt", "updatedAt");

    private final ProductRepository productRepository;
    private final ProductUnitRepository productUnitRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;
    private final TaxActivityGroupRepository taxActivityGroupRepository;
    private final BusinessContextService businessContextService;
    private final ProductImageService productImageService;
    private final ImageStorageService imageStorageService;

    public ProductService(ProductRepository productRepository,
                          ProductUnitRepository productUnitRepository,
                          CategoryRepository categoryRepository,
                          UnitRepository unitRepository,
                          InventoryBalanceRepository inventoryBalanceRepository,
                          TaxActivityGroupRepository taxActivityGroupRepository,
                          BusinessContextService businessContextService,
                          ProductImageService productImageService,
                          ImageStorageService imageStorageService) {
        this.productRepository = productRepository;
        this.productUnitRepository = productUnitRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
        this.inventoryBalanceRepository = inventoryBalanceRepository;
        this.taxActivityGroupRepository = taxActivityGroupRepository;
        this.businessContextService = businessContextService;
        this.productImageService = productImageService;
        this.imageStorageService = imageStorageService;
    }

    public PageResponse<ProductResponse> search(String username, String keyword, String status, Long categoryId,
                                                 int page, int size, String sortBy, String direction) {
        Long businessId = businessContextService.requireBusinessId(username);
        String normalizedStatus = normalizeStatusFilter(status);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(parseDirection(direction), sortableField(sortBy))
        );

        Specification<Product> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("businessId"), businessId));
            if (normalizedStatus != null) {
                predicates.add(builder.equal(root.get("status"), normalizedStatus));
            }
            if (categoryId != null) {
                predicates.add(builder.equal(root.get("categoryId"), categoryId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("productCode")), pattern),
                        builder.like(builder.lower(root.get("productName")), pattern)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };

        Page<ProductResponse> result = productRepository.findAll(specification, pageable).map(this::toResponse);
        return PageResponse.from(result);
    }

    public ProductResponse get(String username, Long id) {
        Long businessId = businessContextService.requireBusinessId(username);
        return toResponse(findOwned(id, businessId));
    }

    public List<ReferenceOption> getUnits() {
        return unitRepository.findAllByStatusOrderByUnitNameAsc(ACTIVE).stream()
                .map(unit -> new ReferenceOption(unit.getId(), unit.getUnitCode(), unit.getUnitName()))
                .toList();
    }

    public List<ReferenceOption> getTaxActivityGroups() {
        return taxActivityGroupRepository.findAllByStatusOrderByActivityNameAsc(ACTIVE).stream()
                .map(group -> new ReferenceOption(group.getId(), group.getActivityCode(), group.getActivityName()))
                .toList();
    }

    @Transactional
    public ProductResponse create(String username, ProductRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        String code = cleanRequired(request.productCode());
        String name = cleanRequired(request.productName());
        BigDecimal quantity = normalizeQuantity(request.quantityOnHand(), BigDecimal.ZERO);
        BigDecimal salePrice = request.salePrice() == null ? BigDecimal.ZERO : request.salePrice();
        if (salePrice.signum() < 0) {
            throw new BadRequestException("Đơn giá sản phẩm không được âm");
        }
        validateUnique(businessId, code, name, null);
        Long baseUnitId = activateOrCreateDefaultUnit().getId();
        validateReferences(businessId, request.categoryId(), baseUnitId, request.defaultTaxActivityGroupId());

        Product saved = productRepository.save(Product.builder()
                .businessId(businessId)
                .productCode(code)
                .productName(name)
                .categoryId(request.categoryId())
                .baseUnitId(baseUnitId)
                .salePrice(salePrice)
                .defaultTaxActivityGroupId(request.defaultTaxActivityGroupId())
                .imageUrl(cleanOptional(request.imageUrl()))
                .description(cleanOptional(request.description()))
                .status(normalizeStatus(request.status(), ACTIVE))
                .build());
        saveBaseUnitConfiguration(saved);
        saveQuantity(saved, quantity);
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(String username, Long id, ProductRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = findOwned(id, businessId);
        String code = cleanRequired(request.productCode());
        String name = cleanRequired(request.productName());
        Long baseUnitId = product.getBaseUnitId();
        validateUnique(businessId, code, name, id);
        validateReferences(businessId, request.categoryId(), baseUnitId, request.defaultTaxActivityGroupId());

        product.setProductCode(code);
        product.setProductName(name);
        product.setCategoryId(request.categoryId());
        product.setBaseUnitId(baseUnitId);
        if (request.salePrice() != null) {
            if (request.salePrice().signum() < 0) {
                throw new BadRequestException("Đơn giá sản phẩm không được âm");
            }
            product.setSalePrice(request.salePrice());
        }
        product.setDefaultTaxActivityGroupId(request.defaultTaxActivityGroupId());
        product.setImageUrl(cleanOptional(request.imageUrl()));
        product.setDescription(cleanOptional(request.description()));
        product.setStatus(normalizeStatus(request.status(), product.getStatus()));
        Product saved = productRepository.save(product);
        if (request.quantityOnHand() != null) {
            saveQuantity(saved, normalizeQuantity(request.quantityOnHand(), BigDecimal.ZERO));
        }
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse deactivate(String username, Long id) {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = findOwned(id, businessId);
        product.setStatus(INACTIVE);
        return toResponse(productRepository.save(product));
    }

    private Product findOwned(Long id, Long businessId) {
        return productRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
    }

    private void validateUnique(Long businessId, String code, String name, Long currentId) {
        boolean duplicateCode = currentId == null
                ? productRepository.existsByBusinessIdAndProductCodeIgnoreCase(businessId, code)
                : productRepository.existsByBusinessIdAndProductCodeIgnoreCaseAndIdNot(businessId, code, currentId);
        if (duplicateCode) {
            throw new BadRequestException("Mã sản phẩm đã tồn tại trong hộ kinh doanh");
        }

        boolean duplicateName = currentId == null
                ? productRepository.existsByBusinessIdAndProductNameIgnoreCase(businessId, name)
                : productRepository.existsByBusinessIdAndProductNameIgnoreCaseAndIdNot(businessId, name, currentId);
        if (duplicateName) {
            throw new BadRequestException("Tên sản phẩm đã tồn tại trong hộ kinh doanh");
        }
    }

    private void validateReferences(Long businessId, Long categoryId, Long unitId, Long taxActivityGroupId) {
        if (categoryId != null) {
            Category category = categoryRepository.findByIdAndBusinessId(categoryId, businessId)
                    .orElseThrow(() -> new BadRequestException("Danh mục không thuộc hộ kinh doanh hiện tại"));
            if (!ACTIVE.equals(category.getStatus())) {
                throw new BadRequestException("Danh mục đã bị vô hiệu hóa");
            }
        }
        unitRepository.findByIdAndStatus(unitId, ACTIVE)
                .orElseThrow(() -> new BadRequestException("Đơn vị tính không tồn tại hoặc đã bị vô hiệu hóa"));
        if (taxActivityGroupId != null) {
            taxActivityGroupRepository.findByIdAndStatus(taxActivityGroupId, ACTIVE)
                    .orElseThrow(() -> new BadRequestException("Nhóm hoạt động tính thuế không tồn tại hoặc đã bị vô hiệu hóa"));
        }
    }

    private ProductResponse toResponse(Product product) {
        Category category = product.getCategoryId() == null
                ? null
                : categoryRepository.findByIdAndBusinessId(product.getCategoryId(), product.getBusinessId()).orElse(null);
        Unit unit = unitRepository.findById(product.getBaseUnitId()).orElse(null);
        TaxActivityGroup taxGroup = product.getDefaultTaxActivityGroupId() == null
                ? null
                : taxActivityGroupRepository.findById(product.getDefaultTaxActivityGroupId()).orElse(null);
        BigDecimal quantityOnHand = inventoryBalanceRepository
                .findByBusinessIdAndProductId(product.getBusinessId(), product.getId())
                .map(InventoryBalance::getQuantityOnHand)
                .orElse(BigDecimal.ZERO);

        List<ProductImageResponse> images = productImageService.getImagesByProductId(product.getId());
        String publicImageUrl = imageStorageService.toPublicUrl(product.getImageUrl());
        BigDecimal salePrice = product.getSalePrice() != null ? product.getSalePrice() : BigDecimal.ZERO;

        return new ProductResponse(
                product.getId(),
                product.getProductCode(),
                product.getProductName(),
                product.getCategoryId(),
                category == null ? null : category.getCategoryName(),
                product.getBaseUnitId(),
                unit == null ? null : unit.getUnitName(),
                salePrice,
                product.getDefaultTaxActivityGroupId(),
                taxGroup == null ? null : taxGroup.getActivityName(),
                publicImageUrl,
                images,
                product.getDescription(),
                product.getStatus(),
                quantityOnHand,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private Unit activateOrCreateDefaultUnit() {
        return unitRepository.findFirstByUnitCodeIgnoreCase(DEFAULT_UNIT_CODE)
                .map(unit -> {
                    if (ACTIVE.equals(unit.getStatus())) {
                        return unit;
                    }
                    unit.setStatus(ACTIVE);
                    return unitRepository.save(unit);
                })
                .orElseGet(() -> unitRepository.save(Unit.builder()
                        .unitCode(DEFAULT_UNIT_CODE)
                        .unitName(DEFAULT_UNIT_NAME)
                        .status(ACTIVE)
                        .build()));
    }

    private void saveQuantity(Product product, BigDecimal quantity) {
        InventoryBalance balance = inventoryBalanceRepository
                .findByBusinessIdAndProductId(product.getBusinessId(), product.getId())
                .orElseGet(() -> InventoryBalance.builder()
                        .businessId(product.getBusinessId())
                        .productId(product.getId())
                        .averageUnitCost(BigDecimal.ZERO)
                        .inventoryValue(BigDecimal.ZERO)
                        .build());
        BigDecimal averageCost = balance.getAverageUnitCost() == null
                ? BigDecimal.ZERO : balance.getAverageUnitCost();
        balance.setQuantityOnHand(quantity);
        balance.setAverageUnitCost(averageCost);
        balance.setInventoryValue(averageCost.multiply(quantity));
        inventoryBalanceRepository.save(balance);
    }

    private void saveBaseUnitConfiguration(Product product) {
        ProductUnit baseUnit = ProductUnit.builder()
                .productId(product.getId())
                .unitId(product.getBaseUnitId())
                .conversionRate(BigDecimal.ONE)
                .baseUnit(true)
                .status(ACTIVE)
                .build();
        productUnitRepository.save(baseUnit);
    }

    private BigDecimal normalizeQuantity(BigDecimal quantity, BigDecimal fallback) {
        BigDecimal normalized = quantity == null ? fallback : quantity;
        if (normalized.signum() < 0) {
            throw new BadRequestException("Số lượng sản phẩm không được âm");
        }
        BigDecimal stripped = normalized.stripTrailingZeros();
        if (stripped.scale() > 0) {
            throw new BadRequestException("Số lượng sản phẩm phải là số nguyên");
        }
        if (normalized.compareTo(MAX_PRODUCT_QUANTITY) > 0) {
            throw new BadRequestException("Số lượng sản phẩm không được vượt quá 15 chữ số");
        }
        return stripped.setScale(0);
    }

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        return normalizeStatus(status, ACTIVE);
    }

    private String normalizeStatus(String status, String fallback) {
        if (status == null || status.isBlank()) {
            return fallback;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!ACTIVE.equals(normalized) && !INACTIVE.equals(normalized)) {
            throw new BadRequestException("Trạng thái phải là ACTIVE hoặc INACTIVE");
        }
        return normalized;
    }

    private String sortableField(String sortBy) {
        return SORTABLE_FIELDS.contains(sortBy) ? sortBy : "createdAt";
    }

    private Sort.Direction parseDirection(String direction) {
        return "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    }

    private String cleanRequired(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
