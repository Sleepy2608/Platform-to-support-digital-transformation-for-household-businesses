package com.hbdt.feedback.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.Feedback;
import com.hbdt.entity.FeedbackHistory;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.feedback.dto.FeedbackCreateRequest;
import com.hbdt.feedback.dto.FeedbackResponseRequest;
import com.hbdt.feedback.dto.FeedbackUpdateStatusRequest;
import com.hbdt.repository.FeedbackHistoryRepository;
import com.hbdt.repository.FeedbackRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock private FeedbackRepository feedbackRepository;
    @Mock private FeedbackHistoryRepository historyRepository;
    @Mock private UserRepository userRepository;

    private FeedbackService service;
    private User owner;
    private User otherOwner;
    private User manager;
    private User admin;

    @BeforeEach
    void setUp() {
        service = new FeedbackService(feedbackRepository, historyRepository, userRepository);
        owner = user(1L, "owner", RoleType.BUSINESS_OWNER, 10L);
        otherOwner = user(2L, "other", RoleType.BUSINESS_OWNER, 10L);
        manager = user(3L, "manager", RoleType.MANAGER, null);
        admin = user(4L, "admin", RoleType.ADMIN, null);
        lenient().when(userRepository.findById(anyLong())).thenReturn(Optional.empty());
        lenient().when(feedbackRepository.save(any(Feedback.class))).thenAnswer(invocation -> {
            Feedback feedback = invocation.getArgument(0);
            if (feedback.getId() == null) feedback.setId(100L);
            return feedback;
        });
    }

    @Test
    void createFeedback_validatesNormalizesAndWritesHistory() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        FeedbackCreateRequest request = FeedbackCreateRequest.builder()
                .feedbackType(" suggestion ").subject("  Góp ý  ").content("  Nội dung  ").build();

        var response = service.createFeedback("owner", request);

        assertThat(response.getFeedbackType()).isEqualTo("SUGGESTION");
        assertThat(response.getSubject()).isEqualTo("Góp ý");
        ArgumentCaptor<FeedbackHistory> history = ArgumentCaptor.forClass(FeedbackHistory.class);
        verify(historyRepository).save(history.capture());
        assertThat(history.getValue().getAction()).isEqualTo("CREATED");
    }

    @Test
    void createFeedback_rejectsUnknownType() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        var request = FeedbackCreateRequest.builder().feedbackType("UNKNOWN").subject("S").content("C").build();
        assertThatThrownBy(() -> service.createFeedback("owner", request))
                .isInstanceOf(BadRequestException.class);
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    void createFeedback_rejectsAccountWithoutBusiness() {
        User unlinkedOwner = user(5L, "unlinked", RoleType.BUSINESS_OWNER, null);
        when(userRepository.findByUsername("unlinked")).thenReturn(Optional.of(unlinkedOwner));
        var request = FeedbackCreateRequest.builder()
                .feedbackType("SUGGESTION").subject("S").content("C").build();

        assertThatThrownBy(() -> service.createFeedback("unlinked", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chưa được liên kết");
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    void myFeedbackQueryAlwaysScopesBySubmittingUser() {
        var pageable = PageRequest.of(0, 10);
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(feedbackRepository.searchMyFeedback(1L, "NEW", "BUG_REPORT", "login", pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        service.getMyFeedbacks("owner", "new", "bug_report", " login ", pageable);

        verify(feedbackRepository).searchMyFeedback(1L, "NEW", "BUG_REPORT", "login", pageable);
        verify(feedbackRepository, never()).searchAllFeedback(any(), any(), any(), any());
    }

    @Test
    void adminFilteringWorksWithoutSearchText() {
        var pageable = PageRequest.of(0, 10);
        when(feedbackRepository.searchAllFeedback("RESOLVED", "COMPLAINT", null, pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        service.getAllFeedbacks("resolved", "complaint", null, pageable);

        verify(feedbackRepository).searchAllFeedback("RESOLVED", "COMPLAINT", null, pageable);
    }

    @Test
    void ownerCannotReadAnotherUsersFeedbackEvenInSameBusiness() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback(7L, otherOwner.getId(), "NEW")));

        assertThatThrownBy(() -> service.getFeedbackDetail("owner", 7L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void ownerCannotReadAnotherUsersHistory() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback(7L, otherOwner.getId(), "NEW")));

        assertThatThrownBy(() -> service.getFeedbackHistory("owner", 7L))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(historyRepository);
    }

    @Test
    void adminCanReadAnyFeedback() {
        Feedback feedback = feedback(7L, otherOwner.getId(), "NEW");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback));

        assertThat(service.getFeedbackDetail("admin", 7L).getId()).isEqualTo(7L);
    }

    @Test
    void managerCanMoveNewFeedbackToInProgress() {
        Feedback feedback = feedback(7L, owner.getId(), "NEW");
        when(userRepository.findByUsername("manager")).thenReturn(Optional.of(manager));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback));

        var result = service.updateStatus("manager", 7L,
                FeedbackUpdateStatusRequest.builder().status("IN_PROGRESS").build());

        assertThat(result.getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(feedback.getResolvedBy()).isEqualTo(manager.getId());
        verify(historyRepository).save(argThat(item -> "STATUS_CHANGED".equals(item.getAction())));
    }

    @Test
    void statusWorkflowRejectsSkippingSteps() {
        when(userRepository.findByUsername("manager")).thenReturn(Optional.of(manager));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback(7L, owner.getId(), "NEW")));

        assertThatThrownBy(() -> service.updateStatus("manager", 7L,
                FeedbackUpdateStatusRequest.builder().status("RESOLVED").build()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Chuyển trạng thái không hợp lệ");
    }

    @Test
    void normalUserCannotManageStatus() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback(7L, owner.getId(), "NEW")));

        assertThatThrownBy(() -> service.updateStatus("owner", 7L,
                FeedbackUpdateStatusRequest.builder().status("IN_PROGRESS").build()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void responseIsSavedAsAppendOnlyHistory() {
        Feedback feedback = feedback(7L, owner.getId(), "IN_PROGRESS");
        when(userRepository.findByUsername("manager")).thenReturn(Optional.of(manager));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback));

        service.addResponse("manager", 7L,
                FeedbackResponseRequest.builder().response("  Đã xử lý yêu cầu  ").build());

        assertThat(feedback.getAdminResponse()).isEqualTo("Đã xử lý yêu cầu");
        verify(historyRepository).save(argThat(item ->
                "RESPONSE_ADDED".equals(item.getAction()) && "Đã xử lý yêu cầu".equals(item.getNewValue())));
    }

    @Test
    void closedFeedbackCannotReceiveMoreResponses() {
        when(userRepository.findByUsername("manager")).thenReturn(Optional.of(manager));
        when(feedbackRepository.findById(7L)).thenReturn(Optional.of(feedback(7L, owner.getId(), "CLOSED")));

        assertThatThrownBy(() -> service.addResponse("manager", 7L,
                FeedbackResponseRequest.builder().response("Late response").build()))
                .isInstanceOf(BadRequestException.class);
    }

    private static User user(Long id, String username, RoleType roleType, Long businessId) {
        return User.builder().id(id).username(username).fullName(username)
                .email(username + "@example.com").businessId(businessId)
                .role(Role.builder().name(roleType).roleName(roleType.name()).build()).build();
    }

    private static Feedback feedback(Long id, Long submittedBy, String status) {
        return Feedback.builder().id(id).businessId(10L).submittedBy(submittedBy)
                .feedbackType("SUGGESTION").subject("Subject").content("Content")
                .status(status).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
    }
}
