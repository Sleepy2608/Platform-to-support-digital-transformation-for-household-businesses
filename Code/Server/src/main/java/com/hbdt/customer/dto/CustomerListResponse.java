package com.hbdt.customer.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO danh sách khách hàng (nhẹ hơn) — dùng cho GET /api/customers (HBDT-47).
 */
public record CustomerListResponse(
        Long id,
        String customerCode,
        String customerName,
        String phone,
        String email,
        BigDecimal debtBalance,
        String status,
        LocalDateTime createdAt
) {
}
