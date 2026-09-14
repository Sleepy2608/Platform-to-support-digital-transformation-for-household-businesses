package com.hbdt.admin.dto.template;

import com.hbdt.entity.enums.TemplateStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request payload for toggling template status (ACTIVE ↔ INACTIVE).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private TemplateStatus status;
}
