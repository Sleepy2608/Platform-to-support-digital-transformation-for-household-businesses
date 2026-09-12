package com.hbdt.announcement;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Announcement;
import com.hbdt.repository.AnnouncementRepository;
import com.hbdt.repository.UserRepository;
import com.hbdt.notification.service.NotificationService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class AnnouncementService {
    private final AnnouncementRepository repository;
    private final UserRepository users;
    private final NotificationService notifications;

    public AnnouncementService(AnnouncementRepository repository, UserRepository users, NotificationService notifications) {
        this.repository = repository;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> list(int page) {
        return repository.findAll(PageRequest.of(Math.max(0, page), 20, Sort.by("id").descending()))
                .map(AnnouncementResponse::from);
    }

    @Transactional
    public AnnouncementResponse create(String username, AnnouncementRequest request) {
        var actor = users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        var announcement = Announcement.builder().createdBy(actor.getId())
                .title(request.title().strip()).content(request.content().strip())
                .audienceType("ALL").status("DRAFT").build();
        return AnnouncementResponse.from(repository.save(announcement));
    }

    @Transactional
    public AnnouncementResponse publish(Long id) {
        // Lock the draft until both its status and every recipient notification commit.
        var announcement = repository.findForPublish(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if ("PUBLISHED".equals(announcement.getStatus())) return AnnouncementResponse.from(announcement);
        if (!"DRAFT".equals(announcement.getStatus()) || !"ALL".equals(announcement.getAudienceType())) {
            throw new BadRequestException("Chỉ phát được bản nháp gửi toàn bộ cửa hàng");
        }
        notifications.notifyAnnouncement(announcement.getTitle(), announcement.getContent());
        announcement.setStatus("PUBLISHED");
        announcement.setPublishedAt(LocalDateTime.now());
        return AnnouncementResponse.from(repository.save(announcement));
    }
}
