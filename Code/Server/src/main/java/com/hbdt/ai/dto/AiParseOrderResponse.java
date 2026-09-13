package com.hbdt.ai.dto;

import com.hbdt.customer.dto.CustomerOptionResponse;
import com.hbdt.product.dto.ProductResponse;
import com.hbdt.product.dto.ProductUnitResponse;
import com.hbdt.pricing.dto.ResolvedPriceResponse;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;

/** AI proposal persisted for human review before an order can be created. */
public record AiParseOrderResponse(
        Long draftId,
        String status,
        LocalDateTime createdAt,
        String provider,
        boolean readyToApply,
        String customerName,
        CustomerOptionResponse customer,
        boolean customerNeedsCreation,
        String paymentType,
        List<Item> items,
        List<String> ambiguities,
        String message
) {
    public record Item(String requestedProductName, BigDecimal quantity, String requestedUnit,
                       ProductResponse product, List<ProductUnitResponse> units,
                       ResolvedPriceResponse price, List<String> issues) {}
}
