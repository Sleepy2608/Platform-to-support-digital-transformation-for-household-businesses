package com.hbdt.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounting_book_entries", uniqueConstraints = @UniqueConstraint(
        name = "uk_accounting_book_entries_number",
        columnNames = {"accounting_book_id", "entry_no"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingBookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "accounting_book_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long accountingBookId;

    @Column(name = "created_by", columnDefinition = "BIGINT UNSIGNED")
    private Long createdBy;

    @Column(name = "entry_no", nullable = false)
    private Integer entryNo;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "source_type", nullable = false, length = 40)
    private String sourceType;

    @Column(name = "source_id", columnDefinition = "BIGINT UNSIGNED")
    private Long sourceId;

    @Column(name = "document_number", length = 100)
    private String documentNumber;

    @Column(name = "description", length = 500)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entry_data", nullable = false, columnDefinition = "json")
    private JsonNode entryData;

    @Column(name = "entry_status", nullable = false, length = 20)
    private String entryStatus;

    @Column(name = "reverses_entry_id", columnDefinition = "BIGINT UNSIGNED")
    private Long reversesEntryId;

    @Column(name = "adjustment_reason", length = 1000)
    private String adjustmentReason;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
