package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a Vietnamese Ward / Commune / Township.
 * Populated on startup by GeoDataInitializer from provinces.open-api.vn.
 */
@Entity
@Table(name = "wards", indexes = {
        @Index(name = "idx_ward_district_code", columnList = "district_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ward {

    @Id
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "name_with_type", length = 150)
    private String nameWithType;

    /** "xa" | "phuong" | "thi-tran" */
    @Column(name = "division_type", length = 30)
    private String divisionType;

    @Column(name = "district_code", nullable = false, length = 10)
    private String districtCode;
}
