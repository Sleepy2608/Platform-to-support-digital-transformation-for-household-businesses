package com.hbdt.accounting.controller;

import com.hbdt.accounting.dto.FilledTemplateReportResponse;
import com.hbdt.accounting.service.AccountingTemplateFillService;
import com.hbdt.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounting/template-reports")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class AccountingTemplateFillController {
    private final AccountingTemplateFillService service;

    public AccountingTemplateFillController(AccountingTemplateFillService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FilledTemplateReportResponse>>> getFilledTemplates(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate) {
        return ResponseEntity.ok(ApiResponse.success("Đã tự động điền các biểu mẫu đang áp dụng",
                service.fillActiveTemplates(authentication.getName(), fromDate, toDate)));
    }
}
