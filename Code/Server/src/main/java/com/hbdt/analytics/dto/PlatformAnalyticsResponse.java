package com.hbdt.analytics.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlatformAnalyticsResponse {

    private long totalOwners;
    private long activeUsers;
    private long newUsers;
    private long newSubscriptions;
    private LocalDate startDate;
    private LocalDate endDate;
}
