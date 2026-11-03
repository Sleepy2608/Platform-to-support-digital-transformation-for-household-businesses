package com.hbdt.sepay.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SepayWebhookResponse {
    private boolean success;
    private String message;

    public static SepayWebhookResponse ok() {
        return new SepayWebhookResponse(true, "Transaction processed successfully");
    }

    public static SepayWebhookResponse ok(String message) {
        return new SepayWebhookResponse(true, message);
    }

    public static SepayWebhookResponse failed(String message) {
        return new SepayWebhookResponse(false, message);
    }
}

