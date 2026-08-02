package com.hbdt.common.service;

import com.hbdt.common.exception.RateLimitException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiting service using Bucket4j token-bucket algorithm.
 * <p>
 * Policies:
 *   - OTP endpoints: 5 requests per 15 minutes per IP/key
 *   - Login endpoint: 10 requests per minute per IP/key
 */
@Service
public class RateLimitService {

    // Separate caches for different rate-limit policies
    private final ConcurrentHashMap<String, Bucket> otpBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

    /**
     * Enforce OTP rate limit: 5 tokens per 15 minutes.
     * Throws RateLimitException if limit exceeded.
     */
    public void checkOtpLimit(String key) {
        Bucket bucket = otpBuckets.computeIfAbsent(key, k -> buildOtpBucket());
        if (!bucket.tryConsume(1)) {
            throw new RateLimitException("Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.");
        }
    }

    /**
     * Enforce login rate limit: 10 tokens per 1 minute.
     * Throws RateLimitException if limit exceeded.
     */
    public void checkLoginLimit(String key) {
        Bucket bucket = loginBuckets.computeIfAbsent(key, k -> buildLoginBucket());
        if (!bucket.tryConsume(1)) {
            throw new RateLimitException("Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút.");
        }
    }

    // ===== Bucket factories =====

    private Bucket buildOtpBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofMinutes(15))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket buildLoginBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
