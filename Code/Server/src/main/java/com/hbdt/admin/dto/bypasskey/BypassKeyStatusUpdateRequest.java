package com.hbdt.admin.dto.bypasskey;

import com.hbdt.entity.enums.BypassKeyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BypassKeyStatusUpdateRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private BypassKeyStatus status;
}

