package com.hbdt.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** In-memory Vietnamese province reference value. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Province {
    private String code;
    private String name;
    private String nameWithType;
    private String divisionType;
}
