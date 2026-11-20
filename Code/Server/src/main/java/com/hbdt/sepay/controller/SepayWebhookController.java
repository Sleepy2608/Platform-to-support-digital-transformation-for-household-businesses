package com.hbdt.sepay.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.sepay.dto.SepayWebhookPayload;
import com.hbdt.sepay.dto.SepayWebhookResponse;
import com.hbdt.sepay.service.SepayWebhookService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(SepayWebhookController.class);
    private final SepayWebhookService sepayWebhookService;

    /**
     * Endpoint nhận Webhook biến động số dư từ SePay.
     * Luôn trả HTTP 200 để SePay không retry — kết quả thật nằm trong response body.
     */
    @PostMapping("/webhook")
    public ResponseEntity<SepayWebhookResponse> handleWebhook(
            @RequestBody SepayWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, authHeader);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[SePay] Lỗi xử lý webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(SepayWebhookResponse.builder()
                    .success(false)
                    .message("Lỗi xử lý: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Endpoint nhận IPN từ SePay (tương thích cả 2 định dạng URL).
     * Luôn trả HTTP 200 để SePay không retry.
     */
    @PostMapping("/ipn")
    public ResponseEntity<SepayWebhookResponse> handleIpn(
            @RequestBody SepayWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, authHeader);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[SePay] Lỗi xử lý IPN: {}", e.getMessage(), e);
            return ResponseEntity.ok(SepayWebhookResponse.builder()
                    .success(false)
                    .message("Lỗi xử lý: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Endpoint kiểm tra tính khả dụng (Health check Webhook)
     */
    @GetMapping("/webhook/health")
    public ResponseEntity<ApiResponse<String>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success("SePay Webhook Endpoint is ready and operational"));
    }
}

