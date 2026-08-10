package com.hbdt.seed.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "seed_config", uniqueConstraints = {
        @UniqueConstraint(name = "uk_seed_config_table", columnNames = "table_name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeedConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_name", nullable = false, length = 128)
    private String tableName;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "row_count", nullable = false)
    private Integer rowCount;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "seed_order", nullable = false)
    private Integer seedOrder;

    @Column(name = "checksum", length = 64)
    private String checksum;

    @Column(name = "last_seeded_checksum", length = 64)
    private String lastSeededChecksum;

    // Version tang dan moi lan snapshot. Restore chi nap khi file moi hon.
    @Column(name = "version")
    private Long version;

    @Column(name = "last_seeded_version")
    private Long lastSeededVersion;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
