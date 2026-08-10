package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Category;
import com.hbdt.entity.Product;
import com.hbdt.entity.TaxActivityGroup;
import com.hbdt.entity.Unit;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.product.dto.ProductRequest;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ReferenceOption;
import com.hbdt.repository.CategoryRepository;
import com.hbdt.repository.ProductRepository;
import com.hbdt.repository.TaxActivityGroupRepository;
import com.hbdt.repository.UnitRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";
    private static final Set<String> SORTABLE_FIELDS = Set.of("productCode", "productName", "status", "createdAt", "updatedAt");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final TaxActivityGroupRepository taxActivityGroupRepository;
    private final BusinessContextService businessContextService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          UnitRepository unitRepository,
                          TaxActivityGroupRepository taxActivityGroupRepository,
                          BusinessContextService businessContextService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.unitRepository = unitRepository;
        this.taxActivityGroupRepository = taxActivityGroupRepository;
        this.businessContextService = businessContextService;
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
        validateUnique(businessId, code, name, null);
        validateReferences(businessId, request.categoryId(), request.baseUnitId(), request.defaultTaxActivityGroupId());

        Product saved = productRepository.save(Product.builder()
                .businessId(businessId)
                .productCode(code)
                .productName(name)
                .categoryId(request.categoryId())
                .baseUnitId(request.baseUnitId())
                .defaultTaxActivityGroupId(request.defaultTaxActivityGroupId())
                .imageUrl(cleanOptional(request.imageUrl()))
                .description(cleanOptional(request.description()))
                .status(normalizeStatus(request.status(), ACTIVE))
                .build());
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(String username, Long id, ProductRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        Product product = findOwned(id, businessId);
        String code = cleanRequired(request.productCode());
        String name = cleanRequired(request.productName());
        validateUnique(businessId, code, name, id);
        validateReferences(businessId, request.categoryId(), request.baseUnitId(), request.defaultTaxActivityGroupId());

        product.setProductCode(code);
        product.setProductName(name);
        product.setCategoryId(request.categoryId());
        product.setBaseUnitId(request.baseUnitId());
        product.setDefaultTaxActivityGroupId(request.defaultTaxActivityGroupId());
        product.setImageUrl(cleanOptional(request.imageUrl()));
        product.setDescription(cleanOptional(request.description()));
        product.setStatus(normalizeStatus(request.status(), product.getStatus()));
        return toResponse(productRepository.save(product));
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

        return new ProductResponse(
                product.getId(),
                product.getProductCode(),
                product.getProductName(),
                product.getCategoryId(),
                category == null ? null : category.getCategoryName(),
                product.getBaseUnitId(),
                unit == null ? null : unit.getUnitName(),
                product.getDefaultTaxActivityGroupId(),
                taxGroup == null ? null : taxGroup.getActivityName(),
                product.getImageUrl(),
                product.getDescription(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
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
