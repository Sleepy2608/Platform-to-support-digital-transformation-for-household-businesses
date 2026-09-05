package com.hbdt.ai.service;

import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class AiExtractionClientTest {
    @Test
    void preservesSnakeCaseFieldsAcrossPythonAndJava() {
        AtomicReference<MockRestServiceServer> mockServer = new AtomicReference<>();
        var builder = new RestTemplateBuilder().additionalCustomizers(template ->
                mockServer.set(MockRestServiceServer.createServer(template)));
        var client = new AiExtractionClient(builder, "http://localhost:8000", "internal-secret", 35);
        mockServer.get().expect(requestTo("http://localhost:8000/api/v1/ai/parse-order"))
                .andExpect(method(HttpMethod.POST)).andExpect(header("X-API-Secret", "internal-secret"))
                .andExpect(content().json("{\"text\":\"Lấy 5 bao xi măng\"}"))
                .andRespond(withSuccess("""
                    {"intent":"CREATE_ORDER","customer_name":"anh Ba","payment_type":"DEBT",
                    "items":[{"product_name":"xi măng","quantity":"5","unit":"bao"}],"ambiguities":[]}
                    """, MediaType.APPLICATION_JSON));
        var result = client.extract("Lấy 5 bao xi măng");
        assertEquals("anh Ba", result.customerName());
        assertEquals("DEBT", result.paymentType());
        assertEquals("xi măng", result.items().getFirst().productName());
        mockServer.get().verify();
    }

    @Test
    void providerFailureNeverExposesRawBody() {
        AtomicReference<MockRestServiceServer> mockServer = new AtomicReference<>();
        var builder = new RestTemplateBuilder().additionalCustomizers(template ->
                mockServer.set(MockRestServiceServer.createServer(template)));
        var client = new AiExtractionClient(builder, "http://localhost:8000", "internal-secret", 35);
        mockServer.get().expect(requestTo("http://localhost:8000/api/v1/ai/parse-order"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).body("sensitive-provider-payload"));
        var error = assertThrows(AiUnavailableException.class, () -> client.extract("Lấy xi măng"));
        assertFalse(error.getMessage().contains("sensitive-provider-payload"));
        mockServer.get().verify();
    }
}
