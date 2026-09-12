package com.hbdt.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO chi tiết khách hàng — dùng cho GET /api/customers/{id} (HBDT-47).
 */
public record CustomerResponse(
        Long id,
        String customerCode,
        String customerName,
        String phone,
        String email,
        String address,
        String note,
        BigDecimal debtBalance,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
