package com.hbdt.consent.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.consent.dto.ConsentRecordResponse;
import com.hbdt.consent.service.TermsConsentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller cho lịch sử chấp thuận Điều khoản &amp; Chính sách bảo mật.
 * Yêu cầu vai trò BUSINESS_OWNER hoặc OWNER.
 */
@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class ConsentController {

    private final TermsConsentService termsConsentService;

    public ConsentController(TermsConsentService termsConsentService) {
        this.termsConsentService = termsConsentService;
    }

    /**
     * GET /api/owner/consent/history
     * Lịch sử chấp thuận Điều khoản sử dụng &amp; Chính sách bảo mật của người dùng hiện tại.
     */
    @GetMapping("/consent/history")
    public ResponseEntity<ApiResponse<List<ConsentRecordResponse>>> getConsentHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ConsentRecordResponse> history =
                termsConsentService.getConsentHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử chấp thuận thành công", history));
    }
}
