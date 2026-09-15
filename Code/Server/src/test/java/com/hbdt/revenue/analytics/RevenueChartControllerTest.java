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

class RevenueChartControllerTest {
    @Configuration @EnableMethodSecurity
    static class Config {
        @Bean RevenueChartService service() { return mock(RevenueChartService.class); }
        @Bean RevenueChartController controller(RevenueChartService s) { return new RevenueChartController(s); }
    }
    @Test void checksRolesAndForwardsAuthenticatedName() {
        try (var ctx = new AnnotationConfigApplicationContext(Config.class)) {
            var controller=ctx.getBean(RevenueChartController.class);
            var service=ctx.getBean(RevenueChartService.class);
            var day=LocalDate.of(2026,9,1);
            for (String role:List.of("EMPLOYEE","ADMIN")) {
                var actor=new UsernamePasswordAuthenticationToken("user","",List.of(new SimpleGrantedAuthority("ROLE_"+role)));
                SecurityContextHolder.getContext().setAuthentication(actor);
                assertThrows(AccessDeniedException.class,()->controller.chart(actor,day,day,RevenueChartService.GroupBy.DAY));
            }
            verifyNoInteractions(service);
            var actor=new UsernamePasswordAuthenticationToken("owner","",List.of(new SimpleGrantedAuthority("ROLE_BUSINESS_OWNER")));
            SecurityContextHolder.getContext().setAuthentication(actor);
            controller.chart(actor,day,day,RevenueChartService.GroupBy.DAY);
            verify(service).chart("owner",day,day,RevenueChartService.GroupBy.DAY);
        } finally { SecurityContextHolder.clearContext(); }
    }
    @Test void rejectsMissingDatesAndInvalidGrouping() throws Exception {
        var service=mock(RevenueChartService.class);
        var mvc=MockMvcBuilders.standaloneSetup(new RevenueChartController(service)).build();
        mvc.perform(get("/api/revenue-ledger/chart")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/revenue-ledger/chart").param("fromDate","2026-09-01").param("toDate","2026-09-01").param("groupBy","random")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
