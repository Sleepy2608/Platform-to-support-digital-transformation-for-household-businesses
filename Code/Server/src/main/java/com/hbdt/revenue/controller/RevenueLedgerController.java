package com.hbdt.revenue.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import com.hbdt.revenue.service.RevenueLedgerService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/revenue-ledger")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class RevenueLedgerController {

    private final RevenueLedgerService revenueLedgerService;

    public RevenueLedgerController(RevenueLedgerService revenueLedgerService) {
        this.revenueLedgerService = revenueLedgerService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RevenueLedgerPageResponse>> getLedger(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        RevenueLedgerPageResponse response = revenueLedgerService.search(
                authentication.getName(),
                fromDate,
                toDate,
                keyword,
                productId,
                page,
                size
        );
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy sổ chi tiết doanh thu thành công",
                response
        ));
    }
}
