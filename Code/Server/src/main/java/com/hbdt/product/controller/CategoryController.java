package com.hbdt.product.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.product.dto.CategoryRequest;
import com.hbdt.product.dto.CategoryResponse;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.product.service.CategoryService;
import com.hbdt.entitlement.annotation.RequireFeature;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
@RequireFeature("PRODUCT_MANAGEMENT")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CategoryResponse>>> search(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách danh mục thành công",
                categoryService.search(authentication.getName(), keyword, status, page, size, sortBy, direction)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> get(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục thành công",
                categoryService.get(authentication.getName(), id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo danh mục thành công",
                categoryService.create(authentication.getName(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công",
                categoryService.update(authentication.getName(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> deactivate(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa danh mục thành công",
                categoryService.deactivate(authentication.getName(), id)));
    }
}
