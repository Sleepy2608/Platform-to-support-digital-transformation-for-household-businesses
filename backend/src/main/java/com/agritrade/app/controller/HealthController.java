package com.agritrade.app.controller;

import com.agritrade.app.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ApiResponse<Map<String, String>> check() {
        return ApiResponse.ok(Map.of("status", "UP", "service", "app-backend"));
    }
}
