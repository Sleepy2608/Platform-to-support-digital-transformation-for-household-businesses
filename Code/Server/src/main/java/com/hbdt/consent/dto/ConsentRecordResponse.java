package com.hbdt.consent.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO trả về một bản ghi chấp thuận trong lịch sử của người dùng.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentRecordResponse {

    private Long id;
    private String termsVersion;
    private String privacyVersion;
    private boolean termsAccepted;
    private boolean privacyAccepted;
    private boolean dataProcessingAccepted;
    private boolean circular88Accepted;
    private boolean infoAccurateConfirmed;
    private boolean inaccuracyUnderstood;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime acceptedAt;
}
