package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a Vietnamese District / Urban District.
 * Populated on startup by GeoDataInitializer from provinces.open-api.vn.
 */
@Entity
@Table(name = "districts", indexes = {
        @Index(name = "idx_district_province_code", columnList = "province_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class District {

    @Id
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_with_type", length = 150)
    private String nameWithType;

    /** "huyen" | "quan" | "thi-xa" | "thanh-pho" */
    @Column(name = "division_type", length = 30)
    private String divisionType;

    @Column(name = "province_code", nullable = false, length = 10)
    private String provinceCode;
}
