package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "units", uniqueConstraints = @UniqueConstraint(
        name = "uk_units_unit_code", columnNames = "unit_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "unit_code", nullable = false, length = 30)
    private String unitCode;

    @Column(name = "unit_name", nullable = false, length = 100)
    private String unitName;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";
}
