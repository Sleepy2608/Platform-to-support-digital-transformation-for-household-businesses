package com.hbdt.feedback.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponse {
    private Long id;
    private Long businessId;
    private Long submittedBy;
    private String submittedByName;
    private String submittedByEmail;
    private Long resolvedBy;
    private String resolvedByName;
    private String feedbackType;
    private String feedbackTypeLabel;
    private String subject;
    private String content;
    private String status;
    private String statusLabel;
    private String adminResponse;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
