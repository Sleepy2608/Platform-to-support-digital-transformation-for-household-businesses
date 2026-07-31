package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Represents a Vietnamese Province / Municipality.
 * Populated on startup by GeoDataInitializer from provinces.open-api.vn.
 */
@Entity
@Table(name = "provinces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Province {

    @Id
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Short name without prefix (e.g. "Hà Nội" instead of "Thành phố Hà Nội") */
    @Column(name = "name_with_type", length = 150)
    private String nameWithType;

    /** "tinh" | "thanh-pho" */
    @Column(name = "division_type", length = 30)
    private String divisionType;
}
