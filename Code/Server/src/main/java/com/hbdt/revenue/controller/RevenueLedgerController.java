package com.hbdt.revenue.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.revenue.dto.RevenueLedgerPageResponse;
import com.hbdt.revenue.dto.AccountingReportReviewRequest;
import com.hbdt.revenue.dto.BusinessOperationsReportResponse;
import com.hbdt.revenue.service.RevenueLedgerService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/operations/review")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<BusinessOperationsReportResponse>> reviewOperationsReport(
            Authentication authentication,
            @Valid @RequestBody AccountingReportReviewRequest request
    ) {
        BusinessOperationsReportResponse response = revenueLedgerService.reviewReport(
                authentication.getName(),
                request.fromDate(),
                request.toDate(),
                request.status(),
                request.note());
        return ResponseEntity.ok(ApiResponse.success("Đã lưu kết quả kiểm tra báo cáo", response));
    }
}
