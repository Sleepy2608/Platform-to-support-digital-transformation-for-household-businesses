package com.hbdt.owner.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request DTO for editing a report's data.
 * Only allowed when the report status is DRAFT or PENDING_REVIEW.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportUpdateRequest {

    @NotNull(message = "Dữ liệu báo cáo không được để trống")
    private JsonNode reportData;
}
