package com.hbdt.admin.controller;

import com.hbdt.admin.dto.template.*;
import com.hbdt.admin.service.FinancialTemplateService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.entity.User;
import com.hbdt.repository.UserRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Admin REST controller for managing Financial Report Templates.
 *
 * <p>All endpoints are secured with both URL-level ({@code /api/admin/**}
 * in SecurityConfig) and method-level ({@code @PreAuthorize}) RBAC.</p>
 */
@RestController
@RequestMapping("/api/admin/templates")
@PreAuthorize("hasRole('ADMIN')")
public class TemplateAdminController {

    private static final Logger logger = LoggerFactory.getLogger(TemplateAdminController.class);

    private final FinancialTemplateService templateService;
    private final UserRepository userRepository;

    public TemplateAdminController(FinancialTemplateService templateService,
                                   UserRepository userRepository) {
        this.templateService = templateService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/admin/templates
     * Creates a new financial report template with its initial version (v1).
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TemplateResponse>> createTemplate(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateTemplateRequest request) {

        Long adminUserId = resolveUserId(userDetails);
        TemplateResponse response = templateService.create(request, adminUserId);

        logger.info("Admin '{}' created template: {}", userDetails.getUsername(), response.getTemplateCode());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo mẫu báo cáo thành công", response));
    }

    /**
     * GET /api/admin/templates
     * Returns a paginated list of templates with optional filters.
     *
     * @param type   optional filter by TemplateType
     * @param status optional filter by TemplateStatus
     * @param search optional keyword search on name/code
     * @param page   zero-based page number (default 0)
     * @param size   page size (default 10)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TemplateListResponse>>> listTemplates(
            @RequestParam(required = false) TemplateType type,
            @RequestParam(required = false) TemplateStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<TemplateListResponse> resultPage = templateService.getList(type, status, search, pageable);

        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách mẫu báo cáo thành công",
                        PageResponse.from(resultPage)));
    }

    /**
     * GET /api/admin/templates/{id}
     * Returns full details of a template including version history.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateResponse>> getTemplate(@PathVariable Long id) {
        TemplateResponse response = templateService.getDetail(id);
        return ResponseEntity.ok(
                ApiResponse.success("Lấy chi tiết mẫu báo cáo thành công", response));
    }

    /**
     * PUT /api/admin/templates/{id}
     * Updates a template. If configuration or name changes, a new
     * immutable version is created automatically.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TemplateResponse>> updateTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateTemplateRequest request) {

        Long adminUserId = resolveUserId(userDetails);
        TemplateResponse response = templateService.update(id, request, adminUserId);

        logger.info("Admin '{}' updated template id={}", userDetails.getUsername(), id);

        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật mẫu báo cáo thành công", response));
    }

    /**
     * PATCH /api/admin/templates/{id}/status
     * Toggles the template status between ACTIVE and INACTIVE.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TemplateResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {

        TemplateResponse response = templateService.updateStatus(id, request.getStatus());

        return ResponseEntity.ok(
                ApiResponse.success("Cập nhật trạng thái mẫu báo cáo thành công", response));
    }

    // ──────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────

    private Long resolveUserId(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .map(User::getId)
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user not found: " + userDetails.getUsername()));
    }
}
