package com.hbdt.ai.controller;

import com.hbdt.ai.dto.AiParseOrderRequest;
import com.hbdt.ai.dto.AiParseOrderResponse;
import com.hbdt.ai.dto.AiDraftRejectRequest;
import com.hbdt.ai.dto.AiBookkeepingDraftResponse;
import com.hbdt.entitlement.annotation.RequireFeature;
import com.hbdt.revenue.service.RevenueLedgerService;
import com.hbdt.ai.service.AiService;
import com.hbdt.ai.service.AiUnavailableException;
import com.hbdt.common.dto.ApiResponse;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class AiController {
    private final AiService aiService;
    private final RevenueLedgerService revenueLedgerService;

    public AiController(AiService aiService, RevenueLedgerService revenueLedgerService) {
        this.aiService = aiService;
        this.revenueLedgerService = revenueLedgerService;
    }

    @PostMapping("/parse-order")
    @RequireFeature("AI_ASSISTANT")
    public ResponseEntity<ApiResponse<AiParseOrderResponse>> parseOrder(
            @Valid @RequestBody AiParseOrderRequest request, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                aiService.parseOrder(authentication.getName(), request)));
    }

    @GetMapping("/drafts")
    @RequireFeature("AI_ASSISTANT")
    public ResponseEntity<ApiResponse<List<AiParseOrderResponse>>> listDrafts(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(aiService.listDrafts(authentication.getName())));
    }

    @PostMapping("/drafts/{id}/reject")
    @RequireFeature("AI_ASSISTANT")
    public ResponseEntity<ApiResponse<AiParseOrderResponse>> rejectDraft(
            @PathVariable Long id, @Valid @RequestBody AiDraftRejectRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đơn nháp AI",
                aiService.rejectDraft(authentication.getName(), id, request)));
    }

    @PostMapping("/draft-bookkeeping")
    @RequireFeature("AI_ASSISTANT")
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<AiBookkeepingDraftResponse>> draftBookkeeping(
            @RequestParam(required = false) java.time.LocalDate fromDate,
            @RequestParam(required = false) java.time.LocalDate toDate,
            Authentication authentication) {
        var report = revenueLedgerService.search(authentication.getName(), fromDate, toDate,
                null, null, 0, 1).operations();
        return ResponseEntity.ok(ApiResponse.success(
                aiService.draftBookkeeping(authentication.getName(), report)));
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
