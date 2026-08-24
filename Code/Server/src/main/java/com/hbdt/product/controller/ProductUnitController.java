package com.hbdt.product.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.product.dto.ProductUnitRequest;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.product.dto.UpdateProductUnitRequest;
import com.hbdt.product.service.ProductUnitService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/units")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class ProductUnitController {

    private final ProductUnitService productUnitService;

    public ProductUnitController(ProductUnitService productUnitService) {
        this.productUnitService = productUnitService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductUnitResponse>>> getProductUnits(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách đơn vị tính thành công",
                productUnitService.getProductUnits(authentication.getName(), productId)
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductUnitResponse>> addUnit(
            Authentication authentication,
            @PathVariable Long productId,
            @Valid @RequestBody ProductUnitRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Thêm đơn vị tính thành công",
                productUnitService.addUnit(authentication.getName(), productId, request)
        ));
    }

    @PutMapping("/{productUnitId}")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductUnitResponse>> updateRate(
            Authentication authentication,
            @PathVariable Long productId,
            @PathVariable Long productUnitId,
            @Valid @RequestBody UpdateProductUnitRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật tỷ lệ quy đổi thành công",
                productUnitService.updateRate(authentication.getName(), productId, productUnitId, request)
        ));
    }

    @DeleteMapping("/{productUnitId}")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            Authentication authentication,
            @PathVariable Long productId,
            @PathVariable Long productUnitId
    ) {
        productUnitService.deactivate(authentication.getName(), productId, productUnitId);
        return ResponseEntity.ok(ApiResponse.success("Vô hiệu hóa đơn vị tính thành công", null));
    }
}
