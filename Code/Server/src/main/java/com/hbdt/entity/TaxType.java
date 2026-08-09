package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tax_types", uniqueConstraints = @UniqueConstraint(
        name = "uk_tax_types_code", columnNames = "tax_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "tax_code", nullable = false, length = 30)
    private String taxCode;

    @Column(name = "tax_name", nullable = false, length = 150)
    private String taxName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status;
}
