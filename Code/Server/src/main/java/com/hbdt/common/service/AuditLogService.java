package com.hbdt.common.service;

import com.hbdt.entity.AuditLog;
import com.hbdt.entity.User;
import com.hbdt.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AuditLogService {

    private static final Pattern ID_SEGMENT = Pattern.compile("/(\\d+)(?=/|$)");

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Persists a successful state-changing API request. Request payloads are
     * deliberately excluded so passwords, OTPs and personal data are not put
     * into the audit table.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User user, HttpServletRequest request) {
        String uri = request.getRequestURI();
        auditLogRepository.save(AuditLog.builder()
                .businessId(user.getBusinessId())
                .userId(user.getId())
                .action(abbreviate(request.getMethod() + " " + normalizeEndpoint(uri), 100))
                .entityType(resolveEntityType(uri))
                .entityId(extractEntityId(uri))
                .ipAddress(abbreviate(resolveClientIp(request), 45))
                .userAgent(abbreviate(request.getHeader("User-Agent"), 500))
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String normalizeEndpoint(String uri) {
        return ID_SEGMENT.matcher(uri).replaceAll("/{id}");
    }

    private String resolveEntityType(String uri) {
        if (uri.startsWith("/api/admin/accounts")) {
            return "USER";
        }
        if (uri.startsWith("/api/owner/business-profile")) {
            return "BUSINESS";
        }
        if (uri.startsWith("/api/owner/subscription")) {
            return "SUBSCRIPTION";
        }
        if (uri.startsWith("/api/seed")) {
            return "SEED_DATA";
        }
        return "API_REQUEST";
    }

    private Long extractEntityId(String uri) {
        Matcher matcher = ID_SEGMENT.matcher(uri);
        Long entityId = null;
        while (matcher.find()) {
            entityId = Long.parseLong(matcher.group(1));
        }
        return entityId;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
