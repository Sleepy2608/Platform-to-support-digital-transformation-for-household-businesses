package com.hbdt.imports.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.BadRequestException;
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

import java.util.List;

/**
 * Controller for product bulk import functionality
 * Only BUSINESS_OWNER and OWNER roles can import products
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
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(defaultValue = "xlsx") String format) {
        if (!"xlsx".equalsIgnoreCase(format) && !"csv".equalsIgnoreCase(format)) {
            throw new BadRequestException("Định dạng tệp mẫu phải là xlsx hoặc csv");
        }
        boolean csv = "csv".equalsIgnoreCase(format);
        byte[] template = csv
                ? productImportService.getCsvTemplateFile()
                : productImportService.getTemplateFile();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(csv
                ? MediaType.parseMediaType("text/csv;charset=UTF-8")
                : MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData(
                "attachment", csv ? "mau_nhap_san_pham.csv" : "mau_nhap_san_pham.xlsx");

        return ResponseEntity.ok().headers(headers).body(template);
    }

    /**
     * Import products from Excel or CSV file
     * POST /api/v1/products/import
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
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
     * POST /api/v1/products/import/error-report
     */
    @PostMapping(
            value = "/error-report",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = "text/csv;charset=UTF-8")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<byte[]> downloadErrorReport(
            @RequestBody List<ProductImportRowError> errors) {

        String filename = errorReportGenerator.generateErrorReportFilename();
        byte[] report = errorReportGenerator.generateErrorReportBytes(errors);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok().headers(headers).body(report);
    }
}
