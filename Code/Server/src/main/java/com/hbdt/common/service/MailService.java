package com.hbdt.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.otp.dev-mode:true}")
    private boolean devMode;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send an OTP email asynchronously.
     * In dev-mode, just logs the OTP and skips actual sending.
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp, String subject, String purpose) {
        if (devMode) {
            logger.info("=== [DEV MODE] OTP Email ===");
            logger.info("To: {}", toEmail);
            logger.info("Purpose: {}", purpose);
            logger.info("OTP Code: {}", otp);
            logger.info("============================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, "HKD Digital Platform");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(buildOtpEmailHtml(otp, purpose), true);

            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", toEmail);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String otp, String purpose) {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Inter, Arial, sans-serif; background-color: #0f0f0f; color: #ffffff; padding: 40px 0;">
              <div style="max-width: 520px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; padding: 40px; border: 1px solid #2a2a2a;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0;">HKD Digital</h1>
                  <p style="color: #71717a; font-size: 14px; margin-top: 6px;">Nền tảng chuyển đổi số cho hộ kinh doanh</p>
                </div>
                <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">%s</h2>
                <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 32px;">Mã xác thực (OTP) của bạn là:</p>
                <div style="background: #27272a; border: 2px solid #3f3f46; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 40px; font-weight: 900; letter-spacing: 16px; color: #ffffff; font-family: monospace;">%s</span>
                </div>
                <p style="color: #71717a; font-size: 13px; line-height: 1.6;">
                  Mã này có hiệu lực trong <strong style="color: #ffffff;">5 phút</strong>.<br>
                  Không chia sẻ mã này với bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
                </p>
                <hr style="border: none; border-top: 1px solid #2a2a2a; margin: 32px 0;">
                <p style="color: #52525b; font-size: 12px; text-align: center;">
                  &copy; 2026 HKD Digital Platform. Bảo lưu mọi quyền.
                </p>
              </div>
            </body>
            </html>
            """.formatted(purpose, otp);
    }
}
