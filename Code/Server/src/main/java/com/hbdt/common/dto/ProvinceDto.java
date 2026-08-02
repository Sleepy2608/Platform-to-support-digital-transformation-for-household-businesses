package com.hbdt.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvinceDto {
    private String code;
    private String name;
    private String nameWithType;
    private String divisionType;
}
