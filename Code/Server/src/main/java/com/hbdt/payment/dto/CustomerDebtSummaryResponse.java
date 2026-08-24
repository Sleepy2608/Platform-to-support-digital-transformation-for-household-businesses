package com.hbdt.payment.dto;

import java.math.BigDecimal;

public record CustomerDebtSummaryResponse(
        Long customerId,
        String customerCode,
        String customerName,
        BigDecimal totalDebtIncreased,
        BigDecimal totalPaid,
        BigDecimal currentBalance
) {
}
