package com.hbdt.announcement;

import com.hbdt.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/announcements")
@PreAuthorize("hasRole('ADMIN')")
public class AnnouncementController {
    private final AnnouncementService service;
    public AnnouncementController(AnnouncementService service) { this.service = service; }

    @GetMapping
    public ApiResponse<Page<AnnouncementResponse>> list(@RequestParam(defaultValue = "0") int page) {
        return ApiResponse.success(service.list(page));
    }

    @PostMapping
    public ApiResponse<AnnouncementResponse> create(Authentication authentication, @Valid @RequestBody AnnouncementRequest request) {
        return ApiResponse.success(service.create(authentication.getName(), request));
    }

    @PostMapping("/{id}/publish")
    public ApiResponse<AnnouncementResponse> publish(@PathVariable Long id) {
        return ApiResponse.success(service.publish(id));
    }
}
