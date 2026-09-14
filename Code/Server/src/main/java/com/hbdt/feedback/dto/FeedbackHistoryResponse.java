package com.hbdt.feedback.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackHistoryResponse {
    private Long id;
    private Long feedbackId;
    private String action;
    private String oldValue;
    private String newValue;
    private Long performedBy;
    private String performedByName;
    private String note;
    private LocalDateTime createdAt;
}
