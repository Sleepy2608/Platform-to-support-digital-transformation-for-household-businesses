package com.hbdt.analytics.service;

import com.hbdt.analytics.dto.PlatformAnalyticsResponse;
import com.hbdt.analytics.dto.PlatformUserDetailResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
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

    private final UserRepository userRepository;

    public PlatformAnalyticsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PlatformAnalyticsResponse getPlatformAnalytics(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu (startDate) không được lớn hơn ngày kết thúc (endDate)");
        }

        long totalOwners = userRepository.countByRole_NameAndStatus(RoleType.BUSINESS_OWNER, UserStatus.ACTIVE);
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);

        long newUsers;
        if (startDate != null && endDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            newUsers = userRepository.countByCreatedAtBetween(startDateTime, endDateTime);
        } else if (startDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            newUsers = userRepository.countByCreatedAtGreaterThanEqual(startDateTime);
        } else if (endDate != null) {
            LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
            newUsers = userRepository.countByCreatedAtLessThanEqual(endDateTime);
        } else {
            newUsers = userRepository.count();
        }

        return PlatformAnalyticsResponse.builder()
                .totalOwners(totalOwners)
                .activeUsers(activeUsers)
                .newUsers(newUsers)
                .newSubscriptions(newUsers)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    public List<PlatformUserDetailResponse> getPlatformUserDetails(String type, LocalDate startDate, LocalDate endDate) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException("Tham số 'type' không được để trống (hợp lệ: owners, active_users, new_users)");
        }

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Ngày bắt đầu (startDate) không được lớn hơn ngày kết thúc (endDate)");
        }

        String normalizedType = type.trim().toLowerCase();
        List<User> users;

        switch (normalizedType) {
            case "owners":
            case "owner":
                users = userRepository.findByRole_NameAndStatusOrderByCreatedAtDesc(RoleType.BUSINESS_OWNER, UserStatus.ACTIVE);
                break;

            case "active_users":
            case "active-users":
            case "active":
                users = userRepository.findByStatusOrderByCreatedAtDesc(UserStatus.ACTIVE);
                break;

            case "new_users":
            case "new-users":
            case "new":
                if (startDate != null && endDate != null) {
                    LocalDateTime startDateTime = startDate.atStartOfDay();
                    LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
                    users = userRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
                } else if (startDate != null) {
                    LocalDateTime startDateTime = startDate.atStartOfDay();
                    users = userRepository.findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(startDateTime);
                } else if (endDate != null) {
                    LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
                    users = userRepository.findByCreatedAtLessThanEqualOrderByCreatedAtDesc(endDateTime);
                } else {
                    users = userRepository.findAllByOrderByCreatedAtDesc();
                }
                break;

            default:
                throw new BadRequestException("Loại danh sách không hợp lệ: " + type + ". Cho phép: owners, active_users, new_users");
        }

        return users.stream().map(this::mapToUserDetailResponse).toList();
    }

    private PlatformUserDetailResponse mapToUserDetailResponse(User user) {
        return PlatformUserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roleName(user.getRole() != null && user.getRole().getName() != null ? user.getRole().getName().name() : null)
                .status(user.getStatus())
                .businessId(user.getBusinessId())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
