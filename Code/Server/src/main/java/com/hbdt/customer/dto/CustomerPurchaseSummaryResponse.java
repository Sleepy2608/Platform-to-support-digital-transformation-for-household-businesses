package com.hbdt.customer.dto;

import java.math.BigDecimal;

public record CustomerPurchaseSummaryResponse(
        BigDecimal totalPurchasedAmount,
        BigDecimal totalDebtAmount
) {}
