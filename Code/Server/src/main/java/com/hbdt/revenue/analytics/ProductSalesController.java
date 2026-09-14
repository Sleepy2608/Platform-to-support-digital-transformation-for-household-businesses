package com.hbdt.revenue.analytics;

import com.hbdt.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/revenue-ledger/products")
@PreAuthorize("hasRole('BUSINESS_OWNER')")
public class ProductSalesController {
    private final ProductSalesService service;
    public ProductSalesController(ProductSalesService service) { this.service = service; }
    @GetMapping
    public ApiResponse<List<ProductSalesRow>> rank(Authentication actor,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "BEST") ProductSalesService.Mode mode,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(service.rank(actor.getName(), fromDate, toDate, mode, limit));
    }
}
