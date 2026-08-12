package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Category;
import com.hbdt.product.dto.CategoryRequest;
import com.hbdt.product.dto.CategoryResponse;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.repository.CategoryRepository;
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
public class CategoryService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";
    private static final Set<String> SORTABLE_FIELDS = Set.of("categoryCode", "categoryName", "status", "createdAt", "updatedAt");

    private final CategoryRepository categoryRepository;
    private final BusinessContextService businessContextService;

    public CategoryService(CategoryRepository categoryRepository,
                           BusinessContextService businessContextService) {
        this.categoryRepository = categoryRepository;
        this.businessContextService = businessContextService;
    }

    public PageResponse<CategoryResponse> search(String username, String keyword, String status,
                                                  int page, int size, String sortBy, String direction) {
        Long businessId = businessContextService.requireBusinessId(username);
        String normalizedStatus = normalizeStatusFilter(status);
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(parseDirection(direction), sortableField(sortBy))
        );

        Specification<Category> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("businessId"), businessId));
            if (normalizedStatus != null) {
                predicates.add(builder.equal(root.get("status"), normalizedStatus));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("categoryCode")), pattern),
                        builder.like(builder.lower(root.get("categoryName")), pattern)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };

        Page<CategoryResponse> result = categoryRepository.findAll(specification, pageable).map(this::toResponse);
        return PageResponse.from(result);
    }

    public CategoryResponse get(String username, Long id) {
        Long businessId = businessContextService.requireBusinessId(username);
        return toResponse(findOwned(id, businessId));
    }

    @Transactional
    public CategoryResponse create(String username, CategoryRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        String code = cleanRequired(request.categoryCode());
        String name = cleanRequired(request.categoryName());
        validateUnique(businessId, code, name, null);

        Category saved = categoryRepository.save(Category.builder()
                .businessId(businessId)
                .categoryCode(code)
                .categoryName(name)
                .description(cleanOptional(request.description()))
                .status(normalizeStatus(request.status(), ACTIVE))
                .build());
        return toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(String username, Long id, CategoryRequest request) {
        Long businessId = businessContextService.requireBusinessId(username);
        Category category = findOwned(id, businessId);
        String code = cleanRequired(request.categoryCode());
        String name = cleanRequired(request.categoryName());
        validateUnique(businessId, code, name, id);

        category.setCategoryCode(code);
        category.setCategoryName(name);
        category.setDescription(cleanOptional(request.description()));
        category.setStatus(normalizeStatus(request.status(), category.getStatus()));
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse deactivate(String username, Long id) {
        Long businessId = businessContextService.requireBusinessId(username);
        Category category = findOwned(id, businessId);
        category.setStatus(INACTIVE);
        return toResponse(categoryRepository.save(category));
    }

    private Category findOwned(Long id, Long businessId) {
        return categoryRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
    }

    private void validateUnique(Long businessId, String code, String name, Long currentId) {
        boolean duplicateCode = currentId == null
                ? categoryRepository.existsByBusinessIdAndCategoryCodeIgnoreCase(businessId, code)
                : categoryRepository.existsByBusinessIdAndCategoryCodeIgnoreCaseAndIdNot(businessId, code, currentId);
        if (duplicateCode) {
            throw new BadRequestException("Mã danh mục đã tồn tại trong hộ kinh doanh");
        }

        boolean duplicateName = currentId == null
                ? categoryRepository.existsByBusinessIdAndCategoryNameIgnoreCase(businessId, name)
                : categoryRepository.existsByBusinessIdAndCategoryNameIgnoreCaseAndIdNot(businessId, name, currentId);
        if (duplicateName) {
            throw new BadRequestException("Tên danh mục đã tồn tại trong hộ kinh doanh");
        }
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getCategoryCode(),
                category.getCategoryName(),
                category.getDescription(),
                category.getStatus(),
                category.getCreatedAt(),
                category.getUpdatedAt()
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
