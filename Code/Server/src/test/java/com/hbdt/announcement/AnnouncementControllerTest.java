package com.hbdt.announcement;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.http.MediaType;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnnouncementControllerTest {
    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean AnnouncementService service() { return mock(AnnouncementService.class); }
        @Bean AnnouncementController controller(AnnouncementService service) { return new AnnouncementController(service); }
    }

    @Test void ownerCannotPublishButAdminCan() {
        try (var context = new AnnotationConfigApplicationContext(Config.class)) {
            var controller = context.getBean(AnnouncementController.class);
            var service = context.getBean(AnnouncementService.class);
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("owner", "", List.of(new SimpleGrantedAuthority("ROLE_BUSINESS_OWNER"))));
            assertThrows(AccessDeniedException.class, () -> controller.publish(1L));
            verifyNoInteractions(service);
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin", "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
            controller.publish(1L);
            verify(service).publish(1L);
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void rejectsBlankAndOversizedContentBeforeService() throws Exception {
        var service = mock(AnnouncementService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new AnnouncementController(service)).build();
        mvc.perform(post("/api/admin/announcements").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"   \",\"content\":\"body\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/announcements").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"title\",\"content\":\"" + "a".repeat(10001) + "\"}")).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
