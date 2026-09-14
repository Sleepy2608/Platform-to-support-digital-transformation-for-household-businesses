package com.hbdt.revenue.analytics;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductSalesControllerTest {
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean ProductSalesService service() { return mock(ProductSalesService.class); }
        @Bean ProductSalesController controller(ProductSalesService s) { return new ProductSalesController(s); }
    }
    @Test void allowsOwnerAndRejectsEmployeeAndAdmin() {
        try (var ctx = new AnnotationConfigApplicationContext(Config.class)) {
            var controller = ctx.getBean(ProductSalesController.class);
            var service = ctx.getBean(ProductSalesService.class);
            var day = LocalDate.of(2026, 9, 1);
            for (String role : List.of("EMPLOYEE", "ADMIN")) {
                var actor = new UsernamePasswordAuthenticationToken("user", "", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(actor);
                assertThrows(AccessDeniedException.class, () -> controller.rank(actor, day, day, ProductSalesService.Mode.BEST, 10));
            }
            verifyNoInteractions(service);
            var actor = new UsernamePasswordAuthenticationToken("owner", "", List.of(new SimpleGrantedAuthority("ROLE_BUSINESS_OWNER")));
            SecurityContextHolder.getContext().setAuthentication(actor);
            controller.rank(actor, day, day, ProductSalesService.Mode.BEST, 10);
            verify(service).rank("owner", day, day, ProductSalesService.Mode.BEST, 10);
        } finally { SecurityContextHolder.clearContext(); }
    }
    @Test void rejectsMalformedFilters() throws Exception {
        var service = mock(ProductSalesService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new ProductSalesController(service)).build();
        mvc.perform(get("/api/revenue-ledger/products")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/revenue-ledger/products").param("fromDate", "bad").param("toDate", "2026-09-01")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/revenue-ledger/products").param("fromDate", "2026-09-01").param("toDate", "2026-09-01").param("mode", "random")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
