package com.hbdt.consent.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.consent.dto.ConsentRecordResponse;
import com.hbdt.consent.dto.ConsentRequest;
import com.hbdt.entity.TermsConsent;
import com.hbdt.entity.User;
import com.hbdt.repository.TermsConsentRepository;
import com.hbdt.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Nghiệp vụ liên quan đến chấp thuận Điều khoản sử dụng &amp; Chính sách bảo mật.
 */
@Service
@Transactional
public class TermsConsentService {

    private final TermsConsentRepository consentRepository;
    private final UserRepository userRepository;

    public TermsConsentService(TermsConsentRepository consentRepository,
                               UserRepository userRepository) {
        this.consentRepository = consentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Xác thực và lưu bản ghi chấp thuận điều khoản tại thời điểm đăng ký.
     * Nếu thiếu bất kỳ xác nhận nào → ném {@link BadRequestException} để từ chối đăng ký.
     */
    public void recordConsent(User user, ConsentRequest consent, HttpServletRequest httpRequest) {
        if (consent == null
                || !consent.isTermsAccepted()
                || !consent.isPrivacyAccepted()
                || !consent.isDataProcessingAccepted()
                || !consent.isCircular88Accepted()
                || !consent.isInfoAccurateConfirmed()
                || !consent.isInaccuracyUnderstood()) {
            throw new BadRequestException(
                    "Bạn phải đồng ý với Điều khoản sử dụng, Chính sách bảo mật và các xác nhận liên quan trước khi đăng ký.");
        }

        String ip = null;
        String userAgent = null;
        if (httpRequest != null) {
            String xfHeader = httpRequest.getHeader("X-Forwarded-For");
            ip = (xfHeader != null && !xfHeader.isEmpty())
                    ? xfHeader.split(",")[0].trim()
                    : httpRequest.getRemoteAddr();
            userAgent = httpRequest.getHeader("User-Agent");
        }

        TermsConsent record = TermsConsent.builder()
                .user(user)
                .termsVersion(consent.getTermsVersion())
                .privacyVersion(consent.getPrivacyVersion())
                .termsAccepted(true)
                .privacyAccepted(true)
                .dataProcessingAccepted(true)
                .circular88Accepted(true)
                .infoAccurateConfirmed(true)
                .inaccuracyUnderstood(true)
                .ipAddress(ip)
                .userAgent(userAgent)
                .build();

        consentRepository.save(record);
    }

    /**
     * Lấy lịch sử chấp thuận của người dùng (mới → cũ).
     */
    @Transactional(readOnly = true)
    public List<ConsentRecordResponse> getConsentHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        return consentRepository.findByUserIdOrderByAcceptedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ConsentRecordResponse toResponse(TermsConsent c) {
        return ConsentRecordResponse.builder()
                .id(c.getId())
                .termsVersion(c.getTermsVersion())
                .privacyVersion(c.getPrivacyVersion())
                .termsAccepted(c.isTermsAccepted())
                .privacyAccepted(c.isPrivacyAccepted())
                .dataProcessingAccepted(c.isDataProcessingAccepted())
                .circular88Accepted(c.isCircular88Accepted())
                .infoAccurateConfirmed(c.isInfoAccurateConfirmed())
                .inaccuracyUnderstood(c.isInaccuracyUnderstood())
                .ipAddress(c.getIpAddress())
                .userAgent(c.getUserAgent())
                .acceptedAt(c.getAcceptedAt())
                .build();
    }
}
