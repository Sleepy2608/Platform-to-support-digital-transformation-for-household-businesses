package com.hbdt.owner.controller;

import com.hbdt.admin.dto.template.TemplateListResponse;
import com.hbdt.admin.dto.template.TemplateResponse;
import com.hbdt.admin.service.FinancialTemplateService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller providing read-only access to Financial Report Templates
 * for Household Business Owners.
 *
 * <p>Allows Owners to inspect active templates, compliance forms, and
 * template version history for statutory transparency.</p>
 */
@RestController
@RequestMapping("/api/owner/templates")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class OwnerTemplateController {

    private final FinancialTemplateService templateService;

    public OwnerTemplateController(FinancialTemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * GET /api/owner/templates
     * Returns a paginated list of active financial report templates.
     *
     * @param type   optional filter by TemplateType
     * @param search optional keyword search on name/code
     * @param page   zero-based page number (default 0)
     * @param size   page size (default 10)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TemplateListResponse>>> listTemplates(
            @RequestParam(required = false) TemplateType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "templateName"));
        // Owners only view active templates
        Page<TemplateListResponse> resultPage = templateService.getList(type, TemplateStatus.ACTIVE, search, pageable);

        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách mẫu báo cáo thành công",
                        PageResponse.from(resultPage)));
    }

    /**
     * GET /api/owner/templates/{id}
     * Returns template details including current configuration and version history.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateResponse>> getTemplate(@PathVariable Long id) {
        TemplateResponse response = templateService.getDetail(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết mẫu báo cáo thành công", response));
    }
}
