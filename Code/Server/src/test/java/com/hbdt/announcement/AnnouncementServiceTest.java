package com.hbdt.announcement;

import com.hbdt.entity.*;
import com.hbdt.repository.*;
import com.hbdt.notification.service.NotificationService;
import com.hbdt.common.exception.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AnnouncementServiceTest {
    AnnouncementRepository repository = mock(AnnouncementRepository.class);
    UserRepository users = mock(UserRepository.class);
    NotificationService notifications = mock(NotificationService.class);
    AnnouncementService service = new AnnouncementService(repository, users, notifications);
    Announcement draft;

    @BeforeEach void setup() {
        draft = Announcement.builder().id(1L).title("Maintenance").content("Tonight")
                .audienceType("ALL").status("DRAFT").build();
    }

    @Test void createsDraftWithAuthenticatedAuthor() {
        when(users.findByUsername("admin")).thenReturn(Optional.of(User.builder().id(7L).build()));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        var result = service.create("admin", new AnnouncementRequest(" Title ", " Body "));
        assertEquals("DRAFT", result.status());
        assertEquals("Title", result.title());
        verify(repository).save(argThat(a -> a.getCreatedBy().equals(7L) && a.getAudienceType().equals("ALL")));
        verifyNoInteractions(notifications);
    }

    @Test void publishesOnceEvenWhenRetried() {
        when(repository.findForPublish(1L)).thenReturn(Optional.of(draft));
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertEquals("PUBLISHED", service.publish(1L).status());
        assertNotNull(service.publish(1L).publishedAt());
        verify(notifications, times(1)).notifyAnnouncement("Maintenance", "Tonight");
        verify(repository, times(1)).save(draft);
    }

    @Test void rejectsMissingAnnouncement() {
        when(repository.findForPublish(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.publish(1L));
        verifyNoInteractions(notifications);
    }

    @Test void rejectsNonDraft() {
        draft.setStatus("CANCELLED");
        when(repository.findForPublish(1L)).thenReturn(Optional.of(draft));
        assertThrows(BadRequestException.class, () -> service.publish(1L));
        verifyNoInteractions(notifications);
    }

    @Test void failureDoesNotMarkPublished() {
        when(repository.findForPublish(1L)).thenReturn(Optional.of(draft));
        doThrow(new IllegalStateException("database failure")).when(notifications).notifyAnnouncement(anyString(), anyString());
        assertThrows(IllegalStateException.class, () -> service.publish(1L));
        assertEquals("DRAFT", draft.getStatus());
        verify(repository, never()).save(any());
    }
}
