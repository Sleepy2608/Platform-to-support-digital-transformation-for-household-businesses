package com.hbdt.notification.service;

import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Notification;
import com.hbdt.entity.Product;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.notification.dto.NotificationResponse;
import com.hbdt.product.service.BusinessContextService;
import com.hbdt.repository.NotificationRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private BusinessContextService businessContextService;
    @Mock private NotificationStreamService streamService;

    private NotificationService service;
    private User owner;
    private User employee;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new NotificationService(
                notificationRepository,
                userRepository,
                businessContextService,
                streamService);

        owner = user(11L, "owner", RoleType.BUSINESS_OWNER);
        employee = user(12L, "employee", RoleType.EMPLOYEE);
        product = Product.builder()
                .id(21L)
                .businessId(7L)
                .productCode("SP-CA-PHE")
                .productName("Cà phê rang xay")
                .build();
    }

    @Test
    void listReturnsAllNotificationsForCurrentActor() {
        Notification first = notification(101L, owner.getId(), false, "LOW_STOCK");
        Notification second = notification(102L, owner.getId(), true, "LOW_STOCK_RESOLVED");
        stubActor(owner);
        when(notificationRepository.findTop100ByBusinessIdAndUserIdOrderByCreatedAtDesc(
                7L, owner.getId())).thenReturn(List.of(first, second));

        List<NotificationResponse> result = service.list(owner.getUsername(), false);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(101L);
        assertThat(result.get(0).read()).isFalse();
        assertThat(result.get(1).type()).isEqualTo("LOW_STOCK_RESOLVED");
        verify(notificationRepository)
                .findTop100ByBusinessIdAndUserIdOrderByCreatedAtDesc(7L, owner.getId());
        verify(notificationRepository, never())
                .findTop100ByBusinessIdAndUserIdAndReadFalseOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void listUnreadUsesUnreadRepositoryQuery() {
        Notification unread = notification(101L, owner.getId(), false, "LOW_STOCK");
        stubActor(owner);
        when(notificationRepository
                .findTop100ByBusinessIdAndUserIdAndReadFalseOrderByCreatedAtDesc(
                        7L, owner.getId()))
                .thenReturn(List.of(unread));

        List<NotificationResponse> result = service.list(owner.getUsername(), true);

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.id()).isEqualTo(101L);
            assertThat(item.read()).isFalse();
        });
        verify(notificationRepository, never())
                .findTop100ByBusinessIdAndUserIdOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void unreadCountIsScopedToBusinessAndUser() {
        stubActor(employee);
        when(notificationRepository.countByBusinessIdAndUserIdAndReadFalse(
                7L, employee.getId())).thenReturn(4L);

        long result = service.unreadCount(employee.getUsername());

        assertThat(result).isEqualTo(4L);
        verify(notificationRepository)
                .countByBusinessIdAndUserIdAndReadFalse(7L, employee.getId());
    }

    @Test
    void markReadUpdatesUnreadNotification() {
        Notification notification = notification(101L, owner.getId(), false, "LOW_STOCK");
        stubActor(owner);
        when(notificationRepository.findByIdAndBusinessIdAndUserId(
                101L, 7L, owner.getId())).thenReturn(Optional.of(notification));

        NotificationResponse result = service.markRead(owner.getUsername(), 101L);

        assertThat(result.read()).isTrue();
        assertThat(result.readAt()).isNotNull();
        assertThat(notification.getRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void markReadIsIdempotentForAlreadyReadNotification() {
        Notification notification = notification(101L, owner.getId(), true, "LOW_STOCK");
        LocalDateTime originalReadAt = LocalDateTime.of(2026, 8, 20, 9, 30);
        notification.setReadAt(originalReadAt);
        stubActor(owner);
        when(notificationRepository.findByIdAndBusinessIdAndUserId(
                101L, 7L, owner.getId())).thenReturn(Optional.of(notification));

        NotificationResponse result = service.markRead(owner.getUsername(), 101L);

        assertThat(result.readAt()).isEqualTo(originalReadAt);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void markReadRejectsNotificationFromAnotherUserOrBusiness() {
        stubActor(owner);
        when(notificationRepository.findByIdAndBusinessIdAndUserId(
                999L, 7L, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(owner.getUsername(), 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("thông báo");
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void requireActorRejectsUnknownUsername() {
        when(businessContextService.requireBusinessId("missing")).thenReturn(7L);
        when(userRepository.findByUsername("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireActor("missing"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("tài khoản");
    }

    @Test
    void notifyLowStockCreatesNotificationForOwnerAndEmployee() {
        User manager = user(13L, "manager", RoleType.MANAGER);
        when(userRepository.findAllByBusinessIdAndStatus(7L, UserStatus.ACTIVE))
                .thenReturn(List.of(owner, employee, manager));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> withGeneratedId(invocation.getArgument(0)));

        service.notifyLowStock(
                7L, product, new BigDecimal("2.000"), new BigDecimal("10.000"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(Notification::getUserId)
                .containsExactly(owner.getId(), employee.getId());
        assertThat(captor.getAllValues())
                .allSatisfy(saved -> {
                    assertThat(saved.getBusinessId()).isEqualTo(7L);
                    assertThat(saved.getNotificationType()).isEqualTo("LOW_STOCK");
                    assertThat(saved.getTitle()).isEqualTo("Cảnh báo tồn kho thấp");
                    assertThat(saved.getContent()).contains("Cà phê rang xay", "SP-CA-PHE", "2.000", "10.000");
                    assertThat(saved.getRead()).isFalse();
                });
        verify(streamService).publish(eq(owner.getId()), any(NotificationResponse.class));
        verify(streamService).publish(eq(employee.getId()), any(NotificationResponse.class));
        verify(streamService, never()).publish(eq(manager.getId()), any(NotificationResponse.class));
    }

    @Test
    void notifyStockRecoveredUsesResolvedTypeAndCurrentQuantity() {
        when(userRepository.findAllByBusinessIdAndStatus(7L, UserStatus.ACTIVE))
                .thenReturn(List.of(owner));
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> withGeneratedId(invocation.getArgument(0)));

        service.notifyStockRecovered(7L, product, new BigDecimal("12.500"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getNotificationType()).isEqualTo("LOW_STOCK_RESOLVED");
        assertThat(saved.getTitle()).isEqualTo("Tồn kho đã an toàn");
        assertThat(saved.getContent()).contains("12.500");
        verify(streamService).publish(eq(owner.getId()), any(NotificationResponse.class));
    }

    @Test
    void notificationDoesNotTargetInactiveUsers() {
        User lockedEmployee = user(14L, "locked", RoleType.EMPLOYEE);
        lockedEmployee.setStatus(UserStatus.LOCKED);
        when(userRepository.findAllByBusinessIdAndStatus(7L, UserStatus.ACTIVE))
                .thenReturn(List.of());

        service.notifyLowStock(
                7L, product, BigDecimal.ONE, BigDecimal.TEN);

        verify(notificationRepository, never()).save(any(Notification.class));
        verify(streamService, never()).publish(any(), any());
    }

    @Test
    void notificationIgnoresUserWithoutRoleDefensively() {
        User invalid = user(15L, "invalid", RoleType.EMPLOYEE);
        invalid.setRole(null);
        when(userRepository.findAllByBusinessIdAndStatus(7L, UserStatus.ACTIVE))
                .thenReturn(List.of(invalid));

        service.notifyLowStock(
                7L, product, BigDecimal.ONE, BigDecimal.TEN);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    private void stubActor(User actor) {
        when(businessContextService.requireBusinessId(actor.getUsername()))
                .thenReturn(actor.getBusinessId());
        when(userRepository.findByUsername(actor.getUsername()))
                .thenReturn(Optional.of(actor));
    }

    private User user(Long id, String username, RoleType roleType) {
        return User.builder()
                .id(id)
                .businessId(7L)
                .username(username)
                .fullName(username)
                .password("hash")
                .status(UserStatus.ACTIVE)
                .role(Role.builder()
                        .id(id)
                        .name(roleType)
                        .roleName(roleType.name())
                        .build())
                .build();
    }

    private Notification notification(Long id, Long userId, boolean read, String type) {
        return Notification.builder()
                .id(id)
                .businessId(7L)
                .userId(userId)
                .notificationType(type)
                .title(type.equals("LOW_STOCK") ? "Cảnh báo tồn kho thấp" : "Tồn kho đã an toàn")
                .content("Nội dung kiểm thử")
                .read(read)
                .createdAt(LocalDateTime.of(2026, 8, 28, 8, 0))
                .build();
    }

    private Notification withGeneratedId(Notification notification) {
        if (notification.getId() == null) {
            notification.setId(notification.getUserId() + 1000);
        }
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.of(2026, 8, 28, 8, 0));
        }
        return notification;
    }
}
