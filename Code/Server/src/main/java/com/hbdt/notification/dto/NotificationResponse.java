package com.hbdt.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String content,
        boolean read,
        LocalDateTime createdAt,
        LocalDateTime readAt
) {
}
