package com.hbdt.announcement;

import com.hbdt.entity.*;
import com.hbdt.entity.enums.*;
import com.hbdt.repository.*;
import com.hbdt.notification.service.*;
import com.hbdt.product.service.BusinessContextService;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.*;
import java.util.List;
import java.util.Set;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class AnnouncementNotificationTest {
    @Test void persistsPerRecipientAndStreamsOnlyAfterCommit() {
        var repository = mock(NotificationRepository.class);
        var users = mock(UserRepository.class);
        var stream = mock(NotificationStreamService.class);
        var service = new NotificationService(repository, users, mock(BusinessContextService.class), stream);
        when(users.findAnnouncementRecipients(UserStatus.ACTIVE, Set.of(RoleType.BUSINESS_OWNER, RoleType.EMPLOYEE)))
                .thenReturn(List.of(User.builder().id(1L).businessId(10L).build(), User.builder().id(2L).businessId(20L).build()));
        when(repository.save(any())).thenAnswer(i -> { Notification n = i.getArgument(0); n.setId(n.getUserId()); return n; });
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.notifyAnnouncement("Title", "Content");
            verify(repository, times(2)).save(any());
            verify(repository).save(argThat(n -> n.getUserId().equals(1L) && n.getBusinessId().equals(10L) && !n.getRead()));
            verifyNoInteractions(stream);
            var callbacks = TransactionSynchronizationManager.getSynchronizations();
            assertEquals(2, callbacks.size());
            callbacks.forEach(TransactionSynchronization::afterCommit);
            verify(stream).publish(eq(1L), any());
            verify(stream).publish(eq(2L), any());
        } finally { TransactionSynchronizationManager.clearSynchronization(); }
    }
}
