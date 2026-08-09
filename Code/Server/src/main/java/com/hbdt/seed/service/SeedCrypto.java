package com.hbdt.seed.service;

import com.hbdt.seed.entity.SeedKey;
import com.hbdt.seed.repository.SeedKeyRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Service
public class SeedCrypto {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BIT = 128;

    private final SeedKeyRepository keyRepository;
    private final PasswordEncoder passwordEncoder;

    private volatile String activeKey;

    public SeedCrypto(SeedKeyRepository keyRepository, PasswordEncoder passwordEncoder) {
        this.keyRepository = keyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean isKeyInitialized() {
        return keyRepository.findTopByOrderByIdAsc().isPresent();
    }

    public boolean isUnlocked() {
        return activeKey != null;
    }

    public synchronized void unlock(String key) {
        SeedKey stored = keyRepository.findTopByOrderByIdAsc().orElse(null);
        if (stored == null) {
            SeedKey newKey = SeedKey.builder()
                    .keyHash(passwordEncoder.encode(key))
                    .build();
            keyRepository.save(newKey);
            this.activeKey = key;
            return;
        }
        if (!passwordEncoder.matches(key, stored.getKeyHash())) {
            throw new IllegalArgumentException("Key không đúng");
        }
        this.activeKey = key;
    }

    public String encrypt(String plainText) {
        requireUnlocked();
        try {
            byte[] iv = deterministicIv(plainText);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey(), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi mã hóa: " + e.getMessage(), e);
        }
    }

    private byte[] deterministicIv(String plainText) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] hash = sha.digest((activeKey + "::" + plainText).getBytes(StandardCharsets.UTF_8));
        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(hash, 0, iv, 0, IV_LENGTH);
        return iv;
    }

    public String decrypt(String cipherText) {
        requireUnlocked();
        try {
            byte[] combined = Base64.getDecoder().decode(cipherText);
            byte[] iv = new byte[IV_LENGTH];
            byte[] encrypted = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, IV_LENGTH);
            System.arraycopy(combined, IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi giải mã (key sai hoặc file hỏng): " + e.getMessage(), e);
        }
    }

    private void requireUnlocked() {
        if (activeKey == null) {
            throw new IllegalStateException("Chưa nhập key để mở khóa seek data");
        }
    }

    private SecretKeySpec secretKey() throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha.digest(activeKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(keyBytes, "AES");
    }
}
