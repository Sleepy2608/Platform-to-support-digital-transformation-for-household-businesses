package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.enums.ReportStatus;
import com.hbdt.owner.dto.ReportRejectRequest;
import com.hbdt.owner.dto.ReportReviewResponse;
import com.hbdt.owner.dto.ReportUpdateRequest;
import com.hbdt.owner.service.ReportAggregationService;
import com.hbdt.owner.service.ReportReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * REST controller for Owner Report Review workflow.
 *
 * <p>Provides endpoints for listing, viewing, editing, confirming
 * and rejecting financial reports that belong to the Owner's
 * household business.</p>
 *
 * <p>All endpoints require BUSINESS_OWNER or OWNER role.</p>
 */
@RestController
@RequestMapping("/api/owner/reports")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class ReportReviewController {

    private final ReportReviewService reportReviewService;
    private final ReportAggregationService reportAggregationService;

    public ReportReviewController(ReportReviewService reportReviewService) {
        this(reportReviewService, null);
    }

    @Autowired
    public ReportReviewController(ReportReviewService reportReviewService,
                                  ReportAggregationService reportAggregationService) {
        this.reportReviewService = reportReviewService;
        this.reportAggregationService = reportAggregationService;
    }

    // =========================================================
    // Generate Report (Bridge / On-demand Aggregation)
    // =========================================================

    /**
     * POST /api/owner/reports/generate
     * Aggregates real-time bookkeeping transactions into a generated report for the period.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<ReportReviewResponse>> generateReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        ReportReviewResponse report =
                reportAggregationService.generateReportForOwner(userDetails.getUsername(), fromDate, toDate);

        return ResponseEntity.ok(ApiResponse.success("Tổng hợp báo cáo thành công", report));
    }

    // =========================================================
    // List Reports
    // =========================================================

    /**
     * GET /api/owner/reports?status=DRAFT&page=0&size=10
     * Returns a paginated list of reports for the authenticated Owner's business.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReportReviewResponse>>> getReports(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReportReviewResponse> reports =
                reportReviewService.getReports(userDetails.getUsername(), status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách báo cáo thành công", reports));
    }

    // =========================================================
    // Report Detail
    // =========================================================

    /**
     * GET /api/owner/reports/{id}
     * Returns full details for a single report. Ownership is verified.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportReviewResponse>> getReportDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        ReportReviewResponse report =
                reportReviewService.getReportDetail(userDetails.getUsername(), id);

        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết báo cáo thành công", report));
    }

    // =========================================================
    // Edit Report
    // =========================================================

    /**
     * PUT /api/owner/reports/{id}
     * Allows Owner to edit the report data (only when DRAFT or PENDING_REVIEW).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportReviewResponse>> editReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ReportUpdateRequest request) {

        ReportReviewResponse report =
                reportReviewService.editReport(userDetails.getUsername(), id, request);

        return ResponseEntity.ok(ApiResponse.success("Cập nhật báo cáo thành công", report));
    }

    // =========================================================
    // Confirm Report
    // =========================================================

    /**
     * POST /api/owner/reports/{id}/confirm
     * Owner confirms the report data is accurate. Status → CONFIRMED.
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<ReportReviewResponse>> confirmReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        ReportReviewResponse report =
                reportReviewService.confirmReport(userDetails.getUsername(), id);

        return ResponseEntity.ok(ApiResponse.success("Xác nhận báo cáo thành công", report));
    }

    // =========================================================
    // Reject Report
    // =========================================================

    /**
     * POST /api/owner/reports/{id}/reject
     * Owner rejects the report with a mandatory reason. Status → REJECTED.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReportReviewResponse>> rejectReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ReportRejectRequest request) {

        ReportReviewResponse report =
                reportReviewService.rejectReport(userDetails.getUsername(), id, request);

        return ResponseEntity.ok(ApiResponse.success("Từ chối báo cáo thành công", report));
    }
}
