package com.hbdt.manager.dto;

import com.hbdt.entity.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BusinessOwnerStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private UserStatus status;
}
