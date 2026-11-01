package com.hbdt.sepay.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.sepay.dto.SepayWebhookPayload;
import com.hbdt.sepay.dto.SepayWebhookResponse;
import com.hbdt.sepay.service.SepayWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {

    private final SepayWebhookService sepayWebhookService;

    /**
     * Endpoint nhận Webhook biến động số dư từ SePay
     */
    @PostMapping("/webhook")
    public ResponseEntity<SepayWebhookResponse> handleWebhook(
            @RequestBody SepayWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, authHeader);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint nhận IPN từ SePay (tương thích cả 2 định dạng URL)
     */
    @PostMapping("/ipn")
    public ResponseEntity<SepayWebhookResponse> handleIpn(
            @RequestBody SepayWebhookPayload payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        SepayWebhookResponse response = sepayWebhookService.processWebhook(payload, authHeader);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint kiểm tra tính khả dụng (Health check Webhook)
     */
    @GetMapping("/webhook/health")
    public ResponseEntity<ApiResponse<String>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success("SePay Webhook Endpoint is ready and operational"));
    }
}

