package com.hbdt.admin.controller;

import com.hbdt.admin.dto.*;
import com.hbdt.admin.service.ReportTemplateAdminService;
import com.hbdt.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/report-templates")
@PreAuthorize("hasRole('ADMIN')")
public class ReportTemplateAdminController {
    private final ReportTemplateAdminService service;
    public ReportTemplateAdminController(ReportTemplateAdminService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportTemplateAdminResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(service.list()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReportTemplateAdminResponse>> create(
            Authentication authentication, @Valid @RequestBody ReportTemplateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã tạo biểu mẫu", service.create(authentication.getName(), request)));
    }

    @PostMapping("/{templateId}/versions")
    public ResponseEntity<ApiResponse<ReportTemplateAdminResponse>> addVersion(
            Authentication authentication, @PathVariable Long templateId,
            @Valid @RequestBody ReportTemplateVersionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã phát hành phiên bản biểu mẫu",
                service.addVersion(authentication.getName(), templateId, request)));
    }
}
