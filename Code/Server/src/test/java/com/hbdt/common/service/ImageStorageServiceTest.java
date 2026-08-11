package com.hbdt.common.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storesImageBySha256AndBuildsPublicUrl() throws Exception {
        ImageStorageService storageService = new ImageStorageService(
                tempDir.toString(), "http://localhost:8080", "8080");
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01, 0x02};
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.jpg", "image/jpeg", jpeg);

        ImageStorageService.StoredImage stored = storageService.store(
                file, "avatars/5", 1024, Set.of("image/jpeg"));

        assertEquals(64, stored.sha256().length());
        assertEquals("image/jpeg", stored.contentType());
        assertEquals(jpeg.length, stored.size());
        assertTrue(stored.objectKey().startsWith("avatars/5/"));
        assertTrue(stored.objectKey().endsWith(".jpg"));
        assertTrue(Files.isRegularFile(tempDir.resolve(stored.objectKey())));
        assertEquals("http://localhost:8080/uploads/" + stored.objectKey(),
                storageService.toPublicUrl(stored.objectKey()));
    }
}
