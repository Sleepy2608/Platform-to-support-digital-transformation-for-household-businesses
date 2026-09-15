package com.hbdt.revenue.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DebtReportItemResponse(
        Long customerId,
        String customerCode,
        String customerName,
        BigDecimal openingBalance,
        BigDecimal debtIncurred,
        BigDecimal amountCollected,
        BigDecimal adjustments,
        BigDecimal closingBalance,
        LocalDateTime lastTransactionAt
) {
}
