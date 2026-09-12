package com.hbdt.feedback.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.Feedback;
import com.hbdt.entity.FeedbackHistory;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.FeedbackStatus;
import com.hbdt.entity.enums.FeedbackType;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.feedback.dto.*;
import com.hbdt.repository.FeedbackHistoryRepository;
import com.hbdt.repository.FeedbackRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackHistoryRepository feedbackHistoryRepository;
    private final UserRepository userRepository;

    public FeedbackService(FeedbackRepository feedbackRepository,
                          FeedbackHistoryRepository feedbackHistoryRepository,
                          UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.feedbackHistoryRepository = feedbackHistoryRepository;
        this.userRepository = userRepository;
    }

    // ==================== USER OPERATIONS ====================

    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getMyFeedbacks(String username, String status, String feedbackType,
                                                   String search, Pageable pageable) {
        User user = getUserByUsername(username);
        String normalizedStatus = normalizeStatusFilter(status);
        String normalizedType = normalizeTypeFilter(feedbackType);
        return feedbackRepository.searchMyFeedback(
                        user.getId(), normalizedStatus, normalizedType, normalizeSearch(search), pageable)
                .map(this::toResponse);
    }

    public FeedbackResponse createFeedback(String username, FeedbackCreateRequest request) {
        User user = getUserByUsername(username);
        if (user.getBusinessId() == null) {
            throw new BadRequestException("Tài khoản chưa được liên kết với hộ kinh doanh");
        }

        String feedbackType = normalizeRequiredType(request.getFeedbackType());

        Feedback feedback = Feedback.builder()
                .businessId(user.getBusinessId())
                .submittedBy(user.getId())
                .feedbackType(feedbackType)
                .subject(request.getSubject().trim())
                .content(request.getContent().trim())
                .status(FeedbackStatus.NEW.name())
                .build();

        Feedback saved = feedbackRepository.save(feedback);

        saveHistory(saved.getId(), "CREATED", null, FeedbackStatus.NEW.name(),
                    user.getId(), "Phản hồi được tạo bởi người dùng");

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public FeedbackResponse getFeedbackDetail(String username, Long feedbackId) {
        User user = getUserByUsername(username);
        Feedback feedback = findFeedbackById(feedbackId);
        validateAccess(feedback, user);

        return toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackHistoryResponse> getFeedbackHistory(String username, Long feedbackId) {
        User user = getUserByUsername(username);
        Feedback feedback = findFeedbackById(feedbackId);
        validateAccess(feedback, user);
        return feedbackHistoryRepository.findByFeedbackIdOrderByCreatedAtDesc(feedbackId)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    // ==================== MANAGER/ADMIN OPERATIONS ====================

    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getAllFeedbacks(String status, String feedbackType, String search, Pageable pageable) {
        return feedbackRepository.searchAllFeedback(
                        normalizeStatusFilter(status), normalizeTypeFilter(feedbackType),
                        normalizeSearch(search), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackResponse> getBusinessFeedbacks(Long businessId, String status, String feedbackType,
                                                         String search, Pageable pageable) {
        return feedbackRepository.searchFeedback(
                        businessId, normalizeStatusFilter(status), normalizeTypeFilter(feedbackType),
                        normalizeSearch(search), pageable)
                .map(this::toResponse);
    }

    public FeedbackResponse updateStatus(String username, Long feedbackId, FeedbackUpdateStatusRequest request) {
        User manager = getUserByUsername(username);
        Feedback feedback = findFeedbackById(feedbackId);

        validateManagerAccess(manager);
        String newStatus = normalizeRequiredStatus(request.getStatus());
        validateStatusTransition(feedback.getStatus(), newStatus);

        String oldStatus = feedback.getStatus();
        feedback.setStatus(newStatus);

        if (FeedbackStatus.IN_PROGRESS.name().equals(newStatus) ||
            FeedbackStatus.RESOLVED.name().equals(newStatus) ||
            FeedbackStatus.CLOSED.name().equals(newStatus)) {
            feedback.setResolvedBy(manager.getId());
        }
        if (FeedbackStatus.RESOLVED.name().equals(newStatus) ||
            FeedbackStatus.CLOSED.name().equals(newStatus)) {
            feedback.setResolvedAt(LocalDateTime.now());
        }

        Feedback saved = feedbackRepository.save(feedback);

        String note = request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() :
                      "Trạng thái được cập nhật bởi " + manager.getFullName();
        saveHistory(feedbackId, "STATUS_CHANGED", oldStatus, newStatus,
                    manager.getId(), note);

        return toResponse(saved);
    }

    public FeedbackResponse addResponse(String username, Long feedbackId, FeedbackResponseRequest request) {
        User manager = getUserByUsername(username);
        Feedback feedback = findFeedbackById(feedbackId);

        validateManagerAccess(manager);
        if (FeedbackStatus.CLOSED.name().equals(feedback.getStatus())) {
            throw new BadRequestException("Không thể phản hồi một yêu cầu đã đóng");
        }

        String response = request.getResponse().trim();

        feedback.setAdminResponse(response);
        feedback.setResolvedBy(manager.getId());

        Feedback saved = feedbackRepository.save(feedback);

        saveHistory(feedbackId, "RESPONSE_ADDED", null, response,
                    manager.getId(), "Phản hồi được thêm bởi " + manager.getFullName());

        return toResponse(saved);
    }

    // ==================== PRIVATE HELPERS ====================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    private Feedback findFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phản hồi với ID: " + id));
    }

    private String normalizeRequiredType(String type) {
        String normalized = normalizeEnumValue(type, "Loại phản hồi");
        try {
            return FeedbackType.valueOf(normalized).name();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Loại phản hồi không hợp lệ. Các loại hợp lệ: " +
                    String.join(", ", Arrays.stream(FeedbackType.values()).map(Enum::name).toList()));
        }
    }

    private String normalizeRequiredStatus(String status) {
        String normalized = normalizeEnumValue(status, "Trạng thái");
        try {
            return FeedbackStatus.valueOf(normalized).name();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái không hợp lệ. Các trạng thái hợp lệ: " +
                    String.join(", ", Arrays.stream(FeedbackStatus.values()).map(Enum::name).toList()));
        }
    }

    private String normalizeStatusFilter(String status) {
        return status == null || status.isBlank() ? null : normalizeRequiredStatus(status);
    }

    private String normalizeTypeFilter(String type) {
        return type == null || type.isBlank() ? null : normalizeRequiredType(type);
    }

    private String normalizeEnumValue(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(fieldName + " không được để trống");
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeSearch(String search) {
        return search == null || search.isBlank() ? null : search.trim();
    }

    private void validateStatusTransition(String currentStatus, String newStatus) {
        if (currentStatus.equals(newStatus)) {
            throw new BadRequestException("Phản hồi đã ở trạng thái này");
        }

        boolean valid = switch (FeedbackStatus.valueOf(currentStatus)) {
            case NEW -> FeedbackStatus.IN_PROGRESS.name().equals(newStatus);
            case IN_PROGRESS -> FeedbackStatus.RESOLVED.name().equals(newStatus);
            case RESOLVED -> FeedbackStatus.CLOSED.name().equals(newStatus);
            case CLOSED -> false;
        };
        if (!valid) {
            throw new BadRequestException("Chuyển trạng thái không hợp lệ: " + currentStatus + " → " + newStatus);
        }
    }

    private void validateAccess(Feedback feedback, User user) {
        RoleType role = user.getRole() != null ? user.getRole().getName() : null;
        if (role == RoleType.ADMIN) {
            return;
        }

        if (role == RoleType.MANAGER) {
            return;
        }

        if (role == RoleType.BUSINESS_OWNER || role == RoleType.EMPLOYEE) {
            if (!feedback.getSubmittedBy().equals(user.getId())) {
                throw new AccessDeniedException("Bạn không có quyền xem phản hồi này");
            }
            return;
        }

        throw new AccessDeniedException("Bạn không có quyền thực hiện hành động này");
    }

    private void validateManagerAccess(User manager) {
        if (manager.getRole() == null ||
            (manager.getRole().getName() != RoleType.ADMIN &&
             manager.getRole().getName() != RoleType.MANAGER)) {
            throw new AccessDeniedException("Bạn không có quyền thực hiện hành động này");
        }
    }

    private void saveHistory(Long feedbackId, String action, String oldValue, String newValue,
                             Long performedBy, String note) {
        FeedbackHistory history = FeedbackHistory.builder()
                .feedbackId(feedbackId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .performedBy(performedBy)
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
        feedbackHistoryRepository.save(history);
    }

    private FeedbackResponse toResponse(Feedback feedback) {
        User submitter = userRepository.findById(feedback.getSubmittedBy()).orElse(null);
        User resolver = feedback.getResolvedBy() != null ?
                        userRepository.findById(feedback.getResolvedBy()).orElse(null) : null;

        String feedbackTypeLabel = "";
        String statusLabel = "";

        try {
            feedbackTypeLabel = FeedbackType.valueOf(feedback.getFeedbackType()).getLabel();
        } catch (IllegalArgumentException ignored) {}

        try {
            statusLabel = FeedbackStatus.valueOf(feedback.getStatus()).getLabel();
        } catch (IllegalArgumentException ignored) {}

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .businessId(feedback.getBusinessId())
                .submittedBy(feedback.getSubmittedBy())
                .submittedByName(submitter != null ? submitter.getFullName() : null)
                .submittedByEmail(submitter != null ? submitter.getEmail() : null)
                .resolvedBy(feedback.getResolvedBy())
                .resolvedByName(resolver != null ? resolver.getFullName() : null)
                .feedbackType(feedback.getFeedbackType())
                .feedbackTypeLabel(feedbackTypeLabel)
                .subject(feedback.getSubject())
                .content(feedback.getContent())
                .status(feedback.getStatus())
                .statusLabel(statusLabel)
                .adminResponse(feedback.getAdminResponse())
                .resolvedAt(feedback.getResolvedAt())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private FeedbackHistoryResponse toHistoryResponse(FeedbackHistory history) {
        User performer = userRepository.findById(history.getPerformedBy()).orElse(null);

        return FeedbackHistoryResponse.builder()
                .id(history.getId())
                .feedbackId(history.getFeedbackId())
                .action(history.getAction())
                .oldValue(history.getOldValue())
                .newValue(history.getNewValue())
                .performedBy(history.getPerformedBy())
                .performedByName(performer != null ? performer.getFullName() : null)
                .note(history.getNote())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
