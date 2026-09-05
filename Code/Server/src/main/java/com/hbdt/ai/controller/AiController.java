package com.hbdt.ai.controller;

import com.hbdt.ai.dto.AiParseOrderRequest;
import com.hbdt.ai.dto.AiParseOrderResponse;
import com.hbdt.ai.service.AiService;
import com.hbdt.ai.service.AiUnavailableException;
import com.hbdt.common.dto.ApiResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/parse-order")
    public ResponseEntity<ApiResponse<AiParseOrderResponse>> parseOrder(
            @Valid @RequestBody AiParseOrderRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                aiService.parseOrder(authentication.getName(), request)));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "configured", aiService.isConfigured(), "provider", "bai", "liveVerified", false)));
    }

    @ExceptionHandler(AiUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> unavailable(AiUnavailableException error) {
        return ResponseEntity.status(503).body(ApiResponse.error(error.getMessage()));
    }
}
