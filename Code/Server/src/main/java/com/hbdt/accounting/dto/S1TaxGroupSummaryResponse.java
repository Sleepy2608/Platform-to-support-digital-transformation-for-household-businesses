package com.hbdt.accounting.dto;

import java.math.BigDecimal;

public record S1TaxGroupSummaryResponse(Long taxActivityGroupId, String activityCode,
        String activityName, BigDecimal vatRate, BigDecimal pitRate, BigDecimal revenue,
        BigDecimal vatPayable, BigDecimal pitPayable) {
}
