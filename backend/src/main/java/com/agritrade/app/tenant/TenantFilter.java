package com.agritrade.app.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * TODO SCRUM-15: doc tenant_id tu claim trong JWT (sau khi xac thuc) roi
 * goi TenantContext.setTenantId(...). Hien tai chi la khung rong, luon clear
 * context sau moi request de tranh ro ri du lieu giua cac request.
 */
@Component
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        try {
            // TODO: TenantContext.setTenantId(extractTenantIdFromJwt(request));
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
