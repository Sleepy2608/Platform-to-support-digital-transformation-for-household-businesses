package com.hbdt.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class StockImportTimestampTest {

    @Test
    void stockImportInitializesRequiredTimestampsBeforeInsert() {
        StockImport stockImport = StockImport.builder().build();

        stockImport.onCreate();

        assertNotNull(stockImport.getImportDate());
        assertNotNull(stockImport.getCreatedAt());
        assertNotNull(stockImport.getUpdatedAt());
    }

    @Test
    void stockImportPreservesExplicitDatesAndRefreshesUpdatedAt() {
        LocalDateTime importDate = LocalDateTime.of(2026, 1, 2, 3, 4);
        LocalDateTime createdAt = LocalDateTime.of(2026, 1, 2, 3, 5);
        StockImport stockImport = StockImport.builder()
                .importDate(importDate)
                .createdAt(createdAt)
                .build();

        stockImport.onCreate();

        assertEquals(importDate, stockImport.getImportDate());
        assertEquals(createdAt, stockImport.getCreatedAt());
        assertNotNull(stockImport.getUpdatedAt());
    }

    @Test
    void stockImportItemInitializesCreatedAtBeforeInsert() {
        StockImportItem item = StockImportItem.builder().build();

        item.onCreate();

        assertNotNull(item.getCreatedAt());
    }
}
