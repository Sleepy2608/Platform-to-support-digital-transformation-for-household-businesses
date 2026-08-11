package com.hbdt.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class TaxActivityGroupTest {

    @Test
    void initializesTimestampsBeforeInsert() {
        TaxActivityGroup group = new TaxActivityGroup();

        group.onCreate();

        assertThat(group.getCreatedAt()).isNotNull();
        assertThat(group.getUpdatedAt()).isEqualTo(group.getCreatedAt());
    }

    @Test
    void refreshesOnlyUpdatedTimestampBeforeUpdate() {
        TaxActivityGroup group = new TaxActivityGroup();
        LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        group.setCreatedAt(createdAt);
        group.setUpdatedAt(createdAt);

        group.onUpdate();

        assertThat(group.getCreatedAt()).isEqualTo(createdAt);
        assertThat(group.getUpdatedAt()).isAfter(createdAt);
    }
}
