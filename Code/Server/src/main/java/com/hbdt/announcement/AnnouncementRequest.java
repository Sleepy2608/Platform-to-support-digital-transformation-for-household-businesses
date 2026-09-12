package com.hbdt.announcement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 10000) String content) {}
