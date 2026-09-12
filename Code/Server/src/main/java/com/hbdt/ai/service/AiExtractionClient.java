package com.hbdt.ai.service;

import com.hbdt.ai.dto.AiExtraction;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class AiExtractionClient {
    private final RestTemplate client;
    private final String serviceUrl;
    private final String apiSecret;

    public AiExtractionClient(RestTemplateBuilder builder,
            @Value("${ai.service.url:http://localhost:8000}") String serviceUrl,
            @Value("${ai.service.api-secret:}") String apiSecret,
            @Value("${ai.service.timeout-seconds:35}") int timeoutSeconds) {
        this.client = builder.setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(timeoutSeconds)).build();
        this.serviceUrl = serviceUrl.replaceAll("/+$", "");
        this.apiSecret = apiSecret;
    }

    public AiExtraction extract(String text) {
        if (apiSecret.isBlank()) {
            throw new AiUnavailableException("Chưa cấu hình kết nối AI service. Vui lòng tạo đơn thủ công.");
        }
        try {
            AiExtraction result = client.postForObject(serviceUrl + "/api/v1/ai/parse-order",
                    new HttpEntity<>(Map.of("text", text), headers()), AiExtraction.class);
            if (result == null || result.items() == null || result.ambiguities() == null
                    || result.paymentType() == null || result.intent() == null) {
                throw new AiUnavailableException("Kết quả AI không hợp lệ. Vui lòng tạo đơn thủ công.");
            }
            return result;
        } catch (HttpStatusCodeException exception) {
            // Never log request text, provider body, or service credentials.
            String message = exception.getStatusCode().value() == 504
                    ? "AI phản hồi quá thời gian. Vui lòng thử lại hoặc tạo đơn thủ công."
                    : "AI chưa sẵn sàng. Kiểm tra cấu hình, quyền model và số dư dịch vụ AI; có thể tạo đơn thủ công.";
            throw new AiUnavailableException(message);
        } catch (RestClientException exception) {
            throw new AiUnavailableException("Không kết nối được AI service. Vui lòng tạo đơn thủ công.");
        }
    }

    public boolean isConfigured() {
        if (apiSecret.isBlank()) return false;
        try {
            var response = client.exchange(serviceUrl + "/api/v1/ai/ready",
                    org.springframework.http.HttpMethod.GET, new HttpEntity<>(headers()), Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (RestClientException exception) {
            return false;
        }
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Secret", apiSecret);
        return headers;
    }
}
