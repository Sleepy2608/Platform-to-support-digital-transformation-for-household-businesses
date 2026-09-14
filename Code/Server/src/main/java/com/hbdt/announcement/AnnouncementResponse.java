package com.hbdt.announcement;

import com.hbdt.entity.Announcement;
import java.time.LocalDateTime;

public record AnnouncementResponse(Long id, String title, String content, String status,
        LocalDateTime createdAt, LocalDateTime publishedAt) {
    public static AnnouncementResponse from(Announcement a) {
        return new AnnouncementResponse(a.getId(), a.getTitle(), a.getContent(), a.getStatus(),
                a.getCreatedAt(), a.getPublishedAt());
    }
}
