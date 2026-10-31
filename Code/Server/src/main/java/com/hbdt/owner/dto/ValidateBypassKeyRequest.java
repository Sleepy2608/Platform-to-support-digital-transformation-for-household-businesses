package com.hbdt.owner.dto;

import jakarta.validation.constraints.NotBlank;
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
public class ValidateBypassKeyRequest {

    @NotBlank(message = "Mã Bypass Key không được để trống")
    private String keyCode;

    private String packageType;

    private String billingCycle;
}

