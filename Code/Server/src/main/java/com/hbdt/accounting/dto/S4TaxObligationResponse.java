package com.hbdt.accounting.dto;

import java.math.BigDecimal;

public record S4TaxObligationResponse(String taxCode, String taxName, BigDecimal taxableRevenue,
        BigDecimal taxPayable, BigDecimal paidAmount, BigDecimal remainingAmount) {
}
