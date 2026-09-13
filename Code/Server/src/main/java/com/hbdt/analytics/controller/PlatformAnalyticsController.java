package com.hbdt.analytics.controller;

import com.hbdt.analytics.dto.PlatformAnalyticsResponse;
import com.hbdt.analytics.service.PlatformAnalyticsService;
import com.hbdt.common.dto.ApiResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/platform/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class PlatformAnalyticsController {

    private final PlatformAnalyticsService platformAnalyticsService;

    public PlatformAnalyticsController(PlatformAnalyticsService platformAnalyticsService) {
        this.platformAnalyticsService = platformAnalyticsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PlatformAnalyticsResponse>> getPlatformAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PlatformAnalyticsResponse response = platformAnalyticsService.getPlatformAnalytics(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu thống kê nền tảng thành công", response));
    }
}
