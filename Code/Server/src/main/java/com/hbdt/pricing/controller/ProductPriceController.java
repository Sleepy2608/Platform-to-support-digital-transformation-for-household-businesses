package com.hbdt.pricing.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.pricing.dto.ProductPriceRequest;
import com.hbdt.pricing.dto.ProductPriceResponse;
import com.hbdt.pricing.dto.UpdateProductPriceRequest;
import com.hbdt.pricing.service.ProductPricingService;
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
@RequestMapping("/api/products/{productId}/prices")
@PreAuthorize("hasRole('BUSINESS_OWNER')")
public class ProductPriceController {

    private final ProductPricingService productPricingService;

    public ProductPriceController(ProductPricingService productPricingService) {
        this.productPricingService = productPricingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductPriceResponse>>> getCurrentPrices(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                productPricingService.getCurrentPrices(authentication.getName(), productId)
        ));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ProductPriceResponse>>> getHistory(
            Authentication authentication,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                productPricingService.getHistory(authentication.getName(), productId)
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductPriceResponse>> create(
            Authentication authentication,
            @PathVariable Long productId,
            @Valid @RequestBody ProductPriceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Thiết lập giá bán thành công",
                productPricingService.create(authentication.getName(), productId, request)
        ));
    }

    @PutMapping("/{priceId}")
    public ResponseEntity<ApiResponse<ProductPriceResponse>> update(
            Authentication authentication,
            @PathVariable Long productId,
            @PathVariable Long priceId,
            @Valid @RequestBody UpdateProductPriceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật giá bán thành công",
                productPricingService.update(authentication.getName(), productId, priceId, request)
        ));
    }

    @DeleteMapping("/{priceId}")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            Authentication authentication,
            @PathVariable Long productId,
            @PathVariable Long priceId
    ) {
        productPricingService.deactivate(authentication.getName(), productId, priceId);
        return ResponseEntity.ok(ApiResponse.success("Ngừng áp dụng mức giá thành công", null));
    }
}
