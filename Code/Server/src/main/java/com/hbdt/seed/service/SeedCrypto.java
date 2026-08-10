package com.hbdt.seed.service;

import org.springframework.stereotype.Service;

/**
 * Truoc day file seek duoc ma hoa bang key. Da bo ma hoa: file seek luu JSON thuong,
 * dong bo theo version (xem SeedService). Giu lai class nay de khong pha interface cu,
 * cac ham chi con la passthrough.
 */
@Service
public class SeedCrypto {

    public boolean isKeyInitialized() {
        return true;
    }

    public boolean isUnlocked() {
        return true;
    }

    public void unlock(String key) {
        // Khong con dung key. Giu ham de tuong thich API cu.
    }

    public String encrypt(String plainText) {
        return plainText;
    }

    public String decrypt(String content) {
        return content;
    }
}
