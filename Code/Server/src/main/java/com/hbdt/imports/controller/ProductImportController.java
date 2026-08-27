package com.hbdt.imports.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.User;
import com.hbdt.imports.dto.ProductImportResponse;
import com.hbdt.imports.dto.ProductImportRowError;
import com.hbdt.imports.service.ProductImportErrorReportGenerator;
import com.hbdt.imports.service.ProductImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller for product bulk import functionality
 * BUSINESS_OWNER, OWNER, and ADMIN roles can import products
 */
@RestController
@RequestMapping("/api/v1/products/import")
@RequiredArgsConstructor
@Slf4j
public class ProductImportController {

    private final ProductImportService productImportService;
    private final ProductImportErrorReportGenerator errorReportGenerator;

    /**
     * Download product import template file
     * GET /api/v1/products/import/template
     */
    @GetMapping("/template")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] template = productImportService.getTemplateFile();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "mau_nhap_san_pham.xlsx");

        return ResponseEntity.ok().headers(headers).body(template);
    }

    /**
     * Import products from Excel or CSV file
     * POST /api/v1/products/import
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<ProductImportResponse>> importProducts(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {

        Long businessId = currentUser.getBusinessId();
        log.info("Product import request from businessId: {}, file: {}, user: {}",
                businessId, file.getOriginalFilename(), currentUser.getUsername());

        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tệp không được để trống"));
        }

        String filename = file.getOriginalFilename();
        String lowerFilename = filename == null ? "" : filename.toLowerCase();
        if (!lowerFilename.endsWith(".xlsx") && !lowerFilename.endsWith(".csv")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "Định dạng tệp không được hỗ trợ. Vui lòng sử dụng tệp .xlsx hoặc .csv"));
        }

        try {
            byte[] fileBytes = file.getBytes();
            ProductImportResponse result = productImportService.importProducts(businessId, fileBytes, filename);

            if (result.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(result));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
            }
        } catch (Exception e) {
            log.error("Product import failed", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Lỗi khi xử lý tệp: " + e.getMessage()));
        }
    }

    /**
     * Download error report for failed imports
     * GET /api/v1/products/import/error-report
     */
    @GetMapping("/error-report")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'ADMIN')")
    public ResponseEntity<byte[]> downloadErrorReport(
            @RequestParam List<Integer> rowNumbers,
            @RequestParam List<String> fields,
            @RequestParam List<String> values,
            @RequestParam List<String> errorMessages) {

        List<ProductImportRowError> errors = new ArrayList<>();
        for (int i = 0; i < rowNumbers.size(); i++) {
            errors.add(ProductImportRowError.builder()
                    .rowNumber(rowNumbers.get(i))
                    .field(fields.get(i))
                    .value(values.get(i))
                    .errorMessage(errorMessages.get(i))
                    .build());
        }

        String filename = errorReportGenerator.generateErrorReportFilename();
        byte[] report = errorReportGenerator.generateErrorReportBytes(errors);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok().headers(headers).body(report);
    }
}
