package com.hbdt.analytics.service;

import com.hbdt.analytics.dto.PlatformAnalyticsResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.SubscriptionStatus;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.repository.SubscriptionRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PlatformAnalyticsService {

    private static final List<SubscriptionStatus> VALID_SUBSCRIPTION_STATUSES = List.of(
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PENDING_PAYMENT,
            SubscriptionStatus.EXPIRED
    );

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    public PlatformAnalyticsService(UserRepository userRepository,
                                   SubscriptionRepository subscriptionRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    public PlatformAnalyticsResponse getPlatformAnalytics(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu (startDate) không được lớn hơn ngày kết thúc (endDate)");
        }

        long totalOwners = userRepository.countByRole_NameAndStatus(RoleType.BUSINESS_OWNER, UserStatus.ACTIVE);
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);

        long newSubscriptions;
        if (startDate != null && endDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            newSubscriptions = subscriptionRepository.countByCreatedAtBetweenAndStatusIn(
                    startDateTime, endDateTime, VALID_SUBSCRIPTION_STATUSES);
        } else if (startDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            newSubscriptions = subscriptionRepository.countByCreatedAtGreaterThanEqualAndStatusIn(
                    startDateTime, VALID_SUBSCRIPTION_STATUSES);
        } else if (endDate != null) {
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            newSubscriptions = subscriptionRepository.countByCreatedAtBetweenAndStatusIn(
                    LocalDateTime.of(1970, 1, 1, 0, 0, 0), endDateTime, VALID_SUBSCRIPTION_STATUSES);
        } else {
            newSubscriptions = subscriptionRepository.countByStatusIn(VALID_SUBSCRIPTION_STATUSES);
        }

        return PlatformAnalyticsResponse.builder()
                .totalOwners(totalOwners)
                .activeUsers(activeUsers)
                .newSubscriptions(newSubscriptions)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }
}
