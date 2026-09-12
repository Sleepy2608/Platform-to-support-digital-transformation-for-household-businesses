package com.hbdt.ai.service;

import com.hbdt.pricing.dto.ResolvePriceRequest;
import jakarta.validation.Validation;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AiQuantityValidationTest {
    @Test
    void fractionalQuantityCanReachPricingServiceForUnitSpecificValidation() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validate(new ResolvePriceRequest(1L, 2L, new BigDecimal("2.5"))).isEmpty());
            assertFalse(validator.validate(new ResolvePriceRequest(1L, 2L, new BigDecimal("0"))).isEmpty());
            assertFalse(validator.validate(new ResolvePriceRequest(1L, 2L, new BigDecimal("0.0001"))).isEmpty());
        }
    }
}
