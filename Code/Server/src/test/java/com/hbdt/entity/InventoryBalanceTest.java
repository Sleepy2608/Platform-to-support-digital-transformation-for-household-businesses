package com.hbdt.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class InventoryBalanceTest {

    @Test
    void initializesUpdatedTimestampBeforeInsert() {
        InventoryBalance balance = new InventoryBalance();

        balance.onCreate();

        assertThat(balance.getUpdatedAt()).isNotNull();
    }

    @Test
    void refreshesUpdatedTimestampBeforeUpdate() {
        InventoryBalance balance = new InventoryBalance();
        LocalDateTime previousUpdatedAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        balance.setUpdatedAt(previousUpdatedAt);

        balance.onUpdate();

        assertThat(balance.getUpdatedAt()).isAfter(previousUpdatedAt);
    }
}
