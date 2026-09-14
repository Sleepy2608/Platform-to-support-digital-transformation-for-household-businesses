package com.hbdt.feedback.controller;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.feedback.dto.FeedbackHistoryResponse;
import com.hbdt.feedback.dto.FeedbackResponse;
import com.hbdt.feedback.service.FeedbackService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackControllerTest {

    @Mock private FeedbackService feedbackService;
    private FeedbackController controller;
    private UsernamePasswordAuthenticationToken authentication;

    @BeforeEach
    void setUp() {
        controller = new FeedbackController(feedbackService);
        authentication = new UsernamePasswordAuthenticationToken("owner", null, List.of());
    }

    @Test
    void returnsSupportedFeedbackTypes() {
        var response = controller.getFeedbackTypes();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).extracting("code")
                .containsExactly("SUGGESTION", "BUG_REPORT", "SUPPORT_REQUEST", "COMPLAINT");
    }

    @Test
    void returnsPageResponseUsingCanonicalRecordShape() {
        FeedbackResponse feedback = FeedbackResponse.builder().id(1L).status("NEW").build();
        when(feedbackService.getMyFeedbacks(eq("owner"), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(feedback)));

        var response = controller.getMyFeedbacks(authentication, 0, 10,
                null, null, null, "createdAt", "desc");

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().content()).containsExactly(feedback);
        assertThat(response.getBody().getData().page()).isZero();
    }

    @Test
    void historyPassesAuthenticatedUsernameForAuthorization() {
        when(feedbackService.getFeedbackHistory("owner", 9L)).thenReturn(List.of(
                FeedbackHistoryResponse.builder().id(1L).feedbackId(9L).build()));

        var response = controller.getFeedbackHistory(authentication, 9L);

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).hasSize(1);
        verify(feedbackService).getFeedbackHistory("owner", 9L);
    }

    @Test
    void rejectsInvalidPaginationAndSortFields() {
        assertThatThrownBy(() -> controller.getMyFeedbacks(authentication, -1, 10,
                null, null, null, "createdAt", "desc"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> controller.getMyFeedbacks(authentication, 0, 101,
                null, null, null, "createdAt", "desc"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> controller.getMyFeedbacks(authentication, 0, 10,
                null, null, null, "unknown", "desc"))
                .isInstanceOf(BadRequestException.class);
    }
}
