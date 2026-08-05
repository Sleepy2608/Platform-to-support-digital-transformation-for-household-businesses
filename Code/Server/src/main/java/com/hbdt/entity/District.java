package com.hbdt.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** In-memory Vietnamese district reference value. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class District {
    private String code;
    private String name;
    private String nameWithType;
    private String divisionType;
    private String provinceCode;
}
