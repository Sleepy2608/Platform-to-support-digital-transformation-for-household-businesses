package com.hbdt.order.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.order.dto.AccountingTransactionResponse;
import com.hbdt.order.dto.RevenueSummaryResponse;
import com.hbdt.order.service.SalesBookkeepingService;
import com.hbdt.product.service.BusinessContextService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * REST Controller cung cap API so ke toan ban hang -- HBDT-59.
 *
 * <p>Tat ca endpoint yeu cau quyen BUSINESS_OWNER hoac OWNER.
 * businessId duoc lay tu security context (thong qua BusinessContextService),
 * khong nhan tu request de tranh leo thang quyen.</p>
 *
 * <h3>Base URL</h3>
 * {@code /api/v1/accounting}
 */
@RestController
@RequestMapping("/api/v1/accounting")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class SalesBookkeepingController {

    private final SalesBookkeepingService salesBookkeepingService;
    private final BusinessContextService businessContextService;

    public SalesBookkeepingController(
            SalesBookkeepingService salesBookkeepingService,
            BusinessContextService businessContextService
    ) {
        this.salesBookkeepingService = salesBookkeepingService;
        this.businessContextService = businessContextService;
    }

    /**
     * Lay danh sach but toan ban hang (co phan trang).
     *
     * <p>Mac dinh tra ve cac giao dich trong thang hien tai, sap xep moi nhat truoc.</p>
     *
     * <pre>
     * GET /api/v1/accounting/sales
     *   ?startDate=2025-01-01T00:00:00   (optional, default: dau thang hien tai)
     *   &endDate=2025-01-31T23:59:59     (optional, default: hien tai)
     *   &page=0&size=20&sort=createdAt,desc
     * </pre>
     *
     * @param authentication Spring Security context
     * @param startDate      dau ky loc (ISO LocalDateTime), nullable
     * @param endDate        cuoi ky loc (ISO LocalDateTime), nullable
     * @param pageable       thong tin phan trang
     * @return danh sach but toan phan trang
     */
    @GetMapping("/sales")
    public ResponseEntity<ApiResponse<PageResponse<AccountingTransactionResponse>>> getTransactions(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Long businessId = businessContextService.requireBusinessId(authentication.getName());

        LocalDateTime effectiveStart = startDate != null
                ? startDate
                : LocalDateTime.now().with(TemporalAdjusters.firstDayOfMonth()).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime effectiveEnd = endDate != null ? endDate : LocalDateTime.now();

        PageResponse<AccountingTransactionResponse> result = PageResponse.from(
                salesBookkeepingService.getTransactions(businessId, effectiveStart, effectiveEnd, pageable)
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Lay bao cao tong hop doanh thu theo ky.
     *
     * <pre>
     * GET /api/v1/accounting/revenue-summary
     *   ?startDate=2025-01-01T00:00:00   (optional, default: dau thang hien tai)
     *   &endDate=2025-01-31T23:59:59     (optional, default: hien tai)
     * </pre>
     *
     * @param authentication Spring Security context
     * @param startDate      dau ky bao cao (ISO LocalDateTime), nullable
     * @param endDate        cuoi ky bao cao (ISO LocalDateTime), nullable
     * @return bao cao tong hop: totalRevenue, totalPaid, totalDebt, totalTransactions
     */
    @GetMapping("/revenue-summary")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenueSummary(
            Authentication authentication,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        Long businessId = businessContextService.requireBusinessId(authentication.getName());

        LocalDateTime effectiveStart = startDate != null
                ? startDate
                : LocalDateTime.now().with(TemporalAdjusters.firstDayOfMonth()).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime effectiveEnd = endDate != null ? endDate : LocalDateTime.now();

        RevenueSummaryResponse summary =
                salesBookkeepingService.getRevenueSummary(businessId, effectiveStart, effectiveEnd);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}