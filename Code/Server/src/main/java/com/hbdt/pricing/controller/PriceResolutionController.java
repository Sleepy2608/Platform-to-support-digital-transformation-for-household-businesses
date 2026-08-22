package com.hbdt.pricing.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.pricing.dto.ResolvePriceRequest;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import com.hbdt.pricing.service.ProductPricingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/product-prices")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'EMPLOYEE')")
public class PriceResolutionController {

    private final ProductPricingService productPricingService;

    public PriceResolutionController(ProductPricingService productPricingService) {
        this.productPricingService = productPricingService;
    }

    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<ResolvedPriceResponse>> resolve(
            Authentication authentication,
            @Valid @RequestBody ResolvePriceRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Áp dụng giá bán thành công",
                productPricingService.resolve(authentication.getName(), request)
        ));
    }
}
