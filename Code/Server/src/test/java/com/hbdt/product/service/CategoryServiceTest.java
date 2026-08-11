package com.hbdt.product.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Category;
import com.hbdt.product.dto.CategoryRequest;
import com.hbdt.product.dto.CategoryResponse;
import com.hbdt.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BusinessContextService businessContextService;

    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, businessContextService);
        when(businessContextService.requireBusinessId("owner")).thenReturn(10L);
    }

    @Test
    void createAssignsAuthenticatedBusinessAndDefaultStatus() {
        CategoryRequest request = new CategoryRequest(" FOOD ", " Thực phẩm ", "Mô tả", null);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category value = invocation.getArgument(0);
            value.setId(1L);
            return value;
        });

        CategoryResponse response = categoryService.create("owner", request);

        assertEquals(1L, response.id());
        assertEquals("FOOD", response.categoryCode());
        assertEquals("Thực phẩm", response.categoryName());
        assertEquals("ACTIVE", response.status());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void createRejectsDuplicateCodeInsideBusiness() {
        CategoryRequest request = new CategoryRequest("FOOD", "Thực phẩm", null, "ACTIVE");
        when(categoryRepository.existsByBusinessIdAndCategoryCodeIgnoreCase(10L, "FOOD")).thenReturn(true);

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> categoryService.create("owner", request));

        assertEquals("Mã danh mục đã tồn tại trong hộ kinh doanh", error.getMessage());
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void deactivateUsesBusinessScopedLookupAndSoftDelete() {
        Category category = Category.builder()
                .id(5L)
                .businessId(10L)
                .categoryCode("FOOD")
                .categoryName("Thực phẩm")
                .status("ACTIVE")
                .build();
        when(categoryRepository.findByIdAndBusinessId(5L, 10L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(category)).thenReturn(category);

        CategoryResponse response = categoryService.deactivate("owner", 5L);

        assertEquals("INACTIVE", response.status());
        verify(categoryRepository).findByIdAndBusinessId(5L, 10L);
        verify(categoryRepository).save(category);
    }
}
