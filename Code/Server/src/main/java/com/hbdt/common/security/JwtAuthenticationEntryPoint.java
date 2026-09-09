package com.hbdt.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * Returns HTTP 401 (Unauthorized) with a JSON body when an unauthenticated
 * request reaches a protected endpoint.
 *
 * Without this, Spring Security defaults to 403 Forbidden for unauthenticated
 * requests, which prevents the frontend auto-refresh mechanism from triggering
 * (it only retries on 401).
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = Map.of(
                "success", false,
                "message", "Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
        );

        MAPPER.writeValue(response.getOutputStream(), body);
    }
}
