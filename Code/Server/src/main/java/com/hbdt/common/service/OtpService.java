package com.hbdt.common.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.OtpCode;
import com.hbdt.entity.enums.OtpType;
import com.hbdt.repository.OtpCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpCodeRepository otpCodeRepository;
    private final MailService mailService;

    @Value("${app.otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    public OtpService(OtpCodeRepository otpCodeRepository, MailService mailService) {
        this.otpCodeRepository = otpCodeRepository;
        this.mailService = mailService;
    }

    /**
     * Generate a new 6-digit OTP for the given user/type/target, invalidate previous ones,
     * persist to DB, and send via email.
     *
     * @param userId user's DB id
     * @param type   OTP purpose (REGISTER, FORGOT_PASSWORD, CHANGE_EMAIL, CHANGE_PHONE)
     * @param target email address or phone number the OTP is sent to
     */
    @Transactional
    public void generateAndSend(Long userId, OtpType type, String target) {
        // Invalidate any existing OTPs for this user + type
        otpCodeRepository.invalidateAllByUserIdAndType(userId, type);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpTtlMinutes);

        OtpCode otpCode = OtpCode.builder()
                .userId(userId)
                .code(code)
                .type(type)
                .target(target)
                .expiresAt(expiresAt)
                .build();

        otpCodeRepository.save(otpCode);

        // Determine email subject and purpose label
        String subject = getSubject(type);
        String purposeLabel = getPurposeLabel(type);

        mailService.sendOtpEmail(target, code, subject, purposeLabel);
        logger.debug("OTP generated for userId={}, type={}, target={}", userId, type, target);
    }

    /**
     * Verify an OTP code. Throws BadRequestException on failure.
     * On success, marks the OTP as used.
     *
     * @param target email/phone that OTP was sent to
     * @param type   OTP type
     * @param code   6-digit code entered by user
     */
    @Transactional
    public void verify(String target, OtpType type, String code) {
        OtpCode otpCode = otpCodeRepository
                .findTopByTargetAndTypeAndCodeAndUsedFalseAndExpiresAtAfter(
                        target, type, code, LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn"));

        otpCode.setUsed(true);
        otpCodeRepository.save(otpCode);
        logger.debug("OTP verified successfully for target={}, type={}", target, type);
    }

    /**
     * Scheduled cleanup: delete expired OTP records every hour.
     */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void cleanupExpiredOtps() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(1);
        otpCodeRepository.deleteExpiredBefore(threshold);
        logger.debug("Cleaned up expired OTP records older than {}", threshold);
    }

    // ===== Private helpers =====

    private String getSubject(OtpType type) {
        return switch (type) {
            case REGISTER -> "[HKD Digital] Mã xác thực đăng ký tài khoản";
            case FORGOT_PASSWORD -> "[HKD Digital] Mã đặt lại mật khẩu";
            case CHANGE_EMAIL -> "[HKD Digital] Mã xác nhận thay đổi email";
            case CHANGE_PHONE -> "[HKD Digital] Mã xác nhận thay đổi số điện thoại";
        };
    }

    private String getPurposeLabel(OtpType type) {
        return switch (type) {
            case REGISTER -> "Xác thực đăng ký tài khoản";
            case FORGOT_PASSWORD -> "Đặt lại mật khẩu";
            case CHANGE_EMAIL -> "Thay đổi địa chỉ email";
            case CHANGE_PHONE -> "Thay đổi số điện thoại";
        };
    }
}
