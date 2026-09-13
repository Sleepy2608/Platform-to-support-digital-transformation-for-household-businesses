package com.hbdt.analytics;

import com.hbdt.analytics.dto.PlatformAnalyticsResponse;
import com.hbdt.analytics.dto.PlatformUserDetailResponse;
import com.hbdt.analytics.service.PlatformAnalyticsService;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformAnalyticsServiceTest {

    @Mock
    private UserRepository userRepository;

    private PlatformAnalyticsService platformAnalyticsService;

    @BeforeEach
    void setUp() {
        platformAnalyticsService = new PlatformAnalyticsService(userRepository);
    }

    @Test
    void getPlatformAnalyticsReturnsCorrectCounts() {
        when(userRepository.countByRole_NameAndStatus(RoleType.BUSINESS_OWNER, UserStatus.ACTIVE)).thenReturn(4L);
        when(userRepository.countByStatus(UserStatus.ACTIVE)).thenReturn(10L);
        when(userRepository.count()).thenReturn(15L);

        PlatformAnalyticsResponse res = platformAnalyticsService.getPlatformAnalytics(null, null);

        assertNotNull(res);
        assertEquals(4L, res.getTotalOwners());
        assertEquals(10L, res.getActiveUsers());
        assertEquals(15L, res.getNewUsers());
        assertEquals(15L, res.getNewSubscriptions());
    }

    @Test
    void getPlatformAnalyticsThrowsExceptionWhenStartDateAfterEndDate() {
        LocalDate start = LocalDate.of(2026, 9, 10);
        LocalDate end = LocalDate.of(2026, 9, 5);

        assertThrows(BadRequestException.class, () -> platformAnalyticsService.getPlatformAnalytics(start, end));
    }

    @Test
    void getPlatformUserDetailsForOwnersReturnsOnlyActiveOwners() {
        Role role = Role.builder().name(RoleType.BUSINESS_OWNER).build();
        User user = User.builder()
                .id(1L)
                .username("owner1")
                .fullName("Owner Test")
                .email("owner@test.com")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByRole_NameAndStatusOrderByCreatedAtDesc(RoleType.BUSINESS_OWNER, UserStatus.ACTIVE))
                .thenReturn(List.of(user));

        List<PlatformUserDetailResponse> list = platformAnalyticsService.getPlatformUserDetails("owners", null, null);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("owner1", list.get(0).getUsername());
        assertEquals("BUSINESS_OWNER", list.get(0).getRoleName());
        assertEquals(UserStatus.ACTIVE, list.get(0).getStatus());
    }

    @Test
    void getPlatformUserDetailsForActiveUsersReturnsUsers() {
        Role role = Role.builder().name(RoleType.MANAGER).build();
        User user = User.builder()
                .id(2L)
                .username("manager1")
                .fullName("Manager Test")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findByStatusOrderByCreatedAtDesc(UserStatus.ACTIVE))
                .thenReturn(List.of(user));

        List<PlatformUserDetailResponse> list = platformAnalyticsService.getPlatformUserDetails("active_users", null, null);

        assertEquals(1, list.size());
        assertEquals("manager1", list.get(0).getUsername());
    }

    @Test
    void getPlatformUserDetailsForNewUsersReturnsUsers() {
        User user = User.builder()
                .id(3L)
                .username("newbie")
                .fullName("New User")
                .createdAt(LocalDateTime.now())
                .status(UserStatus.ACTIVE)
                .build();

        when(userRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(user));

        List<PlatformUserDetailResponse> list = platformAnalyticsService.getPlatformUserDetails("new_users", null, null);

        assertEquals(1, list.size());
        assertEquals("newbie", list.get(0).getUsername());
    }

    @Test
    void getPlatformUserDetailsThrowsOnInvalidType() {
        assertThrows(BadRequestException.class, () -> platformAnalyticsService.getPlatformUserDetails("invalid_type", null, null));
    }
}
