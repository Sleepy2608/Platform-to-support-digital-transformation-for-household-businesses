package com.hbdt.revenue.analytics;

import com.hbdt.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/revenue-ledger/chart")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class RevenueChartController {
    private final RevenueChartService service;
    public RevenueChartController(RevenueChartService service) { this.service = service; }
    @GetMapping
    public ApiResponse<RevenueChartService.Response> chart(Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "DAY") RevenueChartService.GroupBy groupBy) {
        return ApiResponse.success("Lấy biểu đồ doanh thu thành công",
                service.chart(authentication.getName(), fromDate, toDate, groupBy));
    }
}
