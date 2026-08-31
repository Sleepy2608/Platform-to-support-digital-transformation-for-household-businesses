package com.hbdt.notification.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.User;
import com.hbdt.notification.dto.NotificationResponse;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.notification.service.NotificationStreamService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService streamService;

    public NotificationController(
            NotificationService notificationService,
            NotificationStreamService streamService
    ) {
        this.notificationService = notificationService;
        this.streamService = streamService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> list(
            Authentication authentication,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.list(authentication.getName(), unreadOnly)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "count", notificationService.unreadCount(authentication.getName()))));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã đánh dấu thông báo là đã đọc",
                notificationService.markRead(authentication.getName(), id)));
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(Authentication authentication) {
        User actor = notificationService.requireActor(authentication.getName());
        return streamService.subscribe(actor.getId());
    }
}
