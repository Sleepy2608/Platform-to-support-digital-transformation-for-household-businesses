package com.hbdt.sepay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hbdt.sepay.dto.SepayWebhookPayload;
import com.hbdt.sepay.dto.SepayWebhookResponse;
import com.hbdt.sepay.service.SepayWebhookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SepayWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SepayWebhookService sepayWebhookService;

    @InjectMocks
    private SepayWebhookController sepayWebhookController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sepayWebhookController).build();
    }

    @Test
    @DisplayName("POST /api/sepay/webhook xử lý thành công trả về HTTP 200 và success: true")
    void testHandleWebhookSuccess() throws Exception {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92704L)
                .gateway("VietinBank")
                .transferType("in")
                .transferAmount(new BigDecimal("100000"))
                .content("HBDT SUB-TEST-123")
                .build();

        when(sepayWebhookService.processWebhook(any(SepayWebhookPayload.class), eq("Apikey test_key")))
                .thenReturn(SepayWebhookResponse.ok("Processed successfully"));

        mockMvc.perform(post("/api/sepay/webhook")
                        .header("Authorization", "Apikey test_key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Processed successfully"));
    }

    @Test
    @DisplayName("POST /api/sepay/ipn tương thích với endpoint IPN của SePay trả về HTTP 200")
    void testHandleIpnSuccess() throws Exception {
        SepayWebhookPayload payload = SepayWebhookPayload.builder()
                .id(92705L)
                .gateway("VietinBank")
                .transferType("in")
                .transferAmount(new BigDecimal("300000"))
                .content("HBDT RENEW 50 3")
                .build();

        when(sepayWebhookService.processWebhook(any(SepayWebhookPayload.class), eq("Apikey test_key")))
                .thenReturn(SepayWebhookResponse.ok("IPN processed"));

        mockMvc.perform(post("/api/sepay/ipn")
                        .header("Authorization", "Apikey test_key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("IPN processed"));
    }

    @Test
    @DisplayName("GET /api/sepay/webhook/health kiểm tra health check trả về 200 OK")
    void testWebhookHealthCheck() throws Exception {
        mockMvc.perform(get("/api/sepay/webhook/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

