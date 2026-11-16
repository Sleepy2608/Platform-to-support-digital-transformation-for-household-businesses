package com.hbdt.owner.controller;

import com.hbdt.owner.dto.CouponCheckoutResponse;
import com.hbdt.owner.service.CouponCheckoutService;
import com.hbdt.owner.service.OwnerCouponService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OwnerCouponControllerTest {

    @Test
    void createsAndReadsPartialDiscountCheckout() throws Exception {
        var checkoutService = mock(CouponCheckoutService.class);
        var mvc = MockMvcBuilders.standaloneSetup(
                new OwnerCouponController(mock(OwnerCouponService.class), checkoutService)).build();
        var owner = new UsernamePasswordAuthenticationToken("owner", null);
        var pending = new CouponCheckoutResponse("HBDTCP0123456789ABCDEF", new BigDecimal("149250"),
                LocalDateTime.of(2026, 11, 16, 9, 30), "PENDING");
        when(checkoutService.create(eq("owner"), argThat(request -> "BASIC".equals(request.getPackageType())
                && "MONTHLY".equals(request.getBillingCycle())
                && "BasicCoupon123456789".equals(request.getKeyCode())))).thenReturn(pending);
        when(checkoutService.status("owner", pending.reference())).thenReturn(pending);

        mvc.perform(post("/api/owner/coupons/checkouts").principal(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"keyCode":"BasicCoupon123456789","packageType":"BASIC","billingCycle":"MONTHLY"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reference").value(pending.reference()))
                .andExpect(jsonPath("$.data.finalAmount").value(149250));

        mvc.perform(get("/api/owner/coupons/checkouts/{reference}", pending.reference()).principal(owner))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }
}
