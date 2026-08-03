package com.hbdt.common.service;

import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.OtpCode;
import com.hbdt.entity.enums.OtpType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * One-time-password service backed by an in-memory, expiring store.
 * This prevents Hibernate from creating an otp_codes table outside the
 * approved schema. A shared Redis implementation can replace this store when
 * the application is deployed with multiple backend replicas.
 */
@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<String, OtpCode> otpStore = new ConcurrentHashMap<>();
    private final MailService mailService;

    @Value("${app.otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    public OtpService(MailService mailService) {
        this.mailService = mailService;
    }

    public void generateAndSend(Long userId, OtpType type, String target) {
        otpStore.entrySet().removeIf(entry ->
                entry.getValue().getUserId().equals(userId)
                        && entry.getValue().getType() == type);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime now = LocalDateTime.now();
        OtpCode otpCode = OtpCode.builder()
                .userId(userId)
                .code(code)
                .type(type)
                .target(target)
                .expiresAt(now.plusMinutes(otpTtlMinutes))
                .createdAt(now)
                .used(false)
                .build();

        otpStore.put(key(target, type), otpCode);
        mailService.sendOtpEmail(target, code, getSubject(type), getPurposeLabel(type));
        logger.debug("OTP generated for userId={}, type={}, target={}", userId, type, target);
    }

    public void verify(String target, OtpType type, String code) {
        String key = key(target, type);
        synchronized (otpStore) {
            OtpCode otpCode = otpStore.get(key);
            if (otpCode == null || otpCode.isUsed() || otpCode.isExpired()
                    || !otpCode.getCode().equals(code)) {
                throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn");
            }
            otpCode.setUsed(true);
            otpStore.remove(key);
        }
        logger.debug("OTP verified successfully for target={}, type={}", target, type);
    }

    @Scheduled(fixedRate = 3_600_000)
    public void cleanupExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(entry -> entry.getValue().getExpiresAt().isBefore(now));
    }

    private String key(String target, OtpType type) {
        return type.name() + "\u0000" + target.trim().toLowerCase();
    }

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
