package com.hbdt.revenue.dto;

import java.math.BigDecimal;

public record DebtReportSummaryResponse(
        BigDecimal openingBalance,
        BigDecimal debtIncurred,
        BigDecimal amountCollected,
        BigDecimal adjustments,
        BigDecimal closingBalance,
        long customersWithDebt
) {
}
