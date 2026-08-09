package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories", uniqueConstraints = @UniqueConstraint(
        name = "uk_categories_business_code", columnNames = {"business_id", "category_code"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "category_code", nullable = false, length = 30)
    private String categoryCode;

    @Column(name = "category_name", nullable = false, length = 150)
    private String categoryName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
