package com.hbdt.accounting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record StatutoryAccountingBooksResponse(LocalDate fromDate, LocalDate toDate,
        String legalBasis, String taxRateBasis, String inventoryCostMethod,
        List<S1TaxGroupSummaryResponse> s1RevenueByTaxGroup, BigDecimal s1TotalRevenue,
        List<S2InventoryBookItemResponse> s2Inventory,
        List<S4TaxObligationResponse> s4TaxObligations, BigDecimal s4TotalPayable,
        BigDecimal s4TotalPaid, BigDecimal s4TotalRemaining, String reviewStatus,
        String reviewNote, String reviewedByName, LocalDateTime reviewedAt, String dataSignature) {
}
