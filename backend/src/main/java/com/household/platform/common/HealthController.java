package com.household.platform.common;

import com.household.platform.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health / info endpoints cho skeleton và Docker healthcheck.
 */
@RestController
@RequestMapping("/v1")
public class HealthController {

    @Value("${spring.application.name}")
    private String appName;

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        return ApiResponse.ok(Map.of(
                "status", "UP",
                "service", appName,
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/info")
    public ApiResponse<Map<String, Object>> info() {
        return ApiResponse.ok(Map.of(
                "name", "Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh",
                "nameEn", "Platform to Support Digital Transformation for Household Businesses",
                "version", "0.0.1-SNAPSHOT",
                "architecture", "Modular Monolith",
                "scrum", "SCRUM-07 Project Skeleton"
        ));
    }
}
