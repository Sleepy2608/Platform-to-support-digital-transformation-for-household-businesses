package com.hbdt.product.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.product.dto.PageResponse;
import com.hbdt.product.dto.ProductRequest;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ReferenceOption;
import com.hbdt.product.service.ProductService;
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

import java.util.List;

@RestController
@RequestMapping("/api/products")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
@RequireFeature("PRODUCT_MANAGEMENT")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> search(
            Authentication authentication,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách sản phẩm thành công",
                productService.search(authentication.getName(), keyword, status, categoryId,
                        page, size, sortBy, direction)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> get(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy sản phẩm thành công",
                productService.get(authentication.getName(), id)));
    }

    @GetMapping("/references/units")
    public ResponseEntity<ApiResponse<List<ReferenceOption>>> getUnits() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn vị tính thành công", productService.getUnits()));
    }

    @GetMapping("/references/tax-activity-groups")
    public ResponseEntity<ApiResponse<List<ReferenceOption>>> getTaxActivityGroups() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhóm hoạt động tính thuế thành công",
                productService.getTaxActivityGroups()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            Authentication authentication,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo sản phẩm thành công",
                productService.create(authentication.getName(), request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công",
                productService.update(authentication.getName(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> deactivate(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa sản phẩm thành công",
                productService.deactivate(authentication.getName(), id)));
    }
}
