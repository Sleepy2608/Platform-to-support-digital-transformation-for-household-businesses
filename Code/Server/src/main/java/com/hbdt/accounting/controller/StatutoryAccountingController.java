package com.hbdt.accounting.controller;

import com.hbdt.accounting.dto.StatutoryAccountingBooksResponse;
import com.hbdt.accounting.dto.CreateTaxPaymentRequest;
import com.hbdt.accounting.service.StatutoryAccountingService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.revenue.dto.AccountingReportReviewRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/accounting/books")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class StatutoryAccountingController {
    private final StatutoryAccountingService service;

    public StatutoryAccountingController(StatutoryAccountingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<StatutoryAccountingBooksResponse>> getBooks(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success("Lập sổ S1, S2 và S4 thành công",
                service.getBooks(authentication.getName(), fromDate, toDate)));
    }

    @PostMapping("/review")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<StatutoryAccountingBooksResponse>> review(
            Authentication authentication,
            @Valid @RequestBody AccountingReportReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã lưu kết quả kiểm tra sổ kế toán",
                service.review(authentication.getName(), request.fromDate(), request.toDate(),
                        request.status(), request.note())));
    }

    @PostMapping("/tax-payments")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<StatutoryAccountingBooksResponse>> recordTaxPayment(
            Authentication authentication, @Valid @RequestBody CreateTaxPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận chứng từ nộp thuế",
                service.recordTaxPayment(authentication.getName(), request)));
    }
}
