package com.hbdt.customer.dto;

import java.math.BigDecimal;

public record CustomerOptionResponse(
        Long id,
        String customerCode,
        String customerName,
        String phone,
        BigDecimal debtBalance
) {
}

