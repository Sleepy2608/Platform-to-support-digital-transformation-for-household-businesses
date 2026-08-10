package com.hbdt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounting_books", uniqueConstraints = @UniqueConstraint(
        name = "uk_accounting_books_business_period",
        columnNames = {"business_id", "book_code", "period_from", "period_to"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "business_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long businessId;

    @Column(name = "template_version_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long templateVersionId;

    @Column(name = "book_code", nullable = false, length = 50)
    private String bookCode;

    @Column(name = "book_name", nullable = false, length = 255)
    private String bookName;

    @Column(name = "period_from", nullable = false)
    private LocalDate periodFrom;

    @Column(name = "period_to", nullable = false)
    private LocalDate periodTo;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "opened_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime openedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
