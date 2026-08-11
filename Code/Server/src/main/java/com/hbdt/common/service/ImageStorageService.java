package com.hbdt.common.service;

import com.hbdt.common.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

@Service
public class ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageStorageService.class);
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final Path uploadRoot;
    private final String publicBaseUrl;

    public ImageStorageService(@Value("${app.upload.dir:}") String configuredUploadDir,
                               @Value("${app.public-base-url:}") String configuredPublicBaseUrl,
                               @Value("${server.port:8080}") String serverPort) {
        this.uploadRoot = resolveUploadRoot(configuredUploadDir);
        this.publicBaseUrl = normalizeBaseUrl(configuredPublicBaseUrl, serverPort);
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể khởi tạo thư mục upload: " + uploadRoot, exception);
        }
        logger.info("Upload directory resolved to {}", uploadRoot);
    }

    public StoredImage store(MultipartFile file,
                             String directory,
                             long maxSize,
                             Set<String> allowedContentTypes) throws IOException {
        validateFile(file, maxSize, allowedContentTypes);

        byte[] content = file.getBytes();
        String contentType = file.getContentType();

        String sha256 = sha256(content);
        String objectKey = normalizeObjectKey(directory + "/" + sha256 + EXTENSIONS.get(contentType));
        Path target = resolveObjectKey(objectKey);
        Files.createDirectories(target.getParent());
        Files.write(target, content, StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);

        return new StoredImage(objectKey, sha256, contentType, content.length);
    }

    public String normalizeObjectKey(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        String normalized = value.trim().replace('\\', '/');
        int uploadsIndex = normalized.indexOf("/uploads/");
        if (uploadsIndex >= 0) {
            normalized = normalized.substring(uploadsIndex + "/uploads/".length());
        }
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }

    public String toPublicUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return objectKey;
        }
        if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
            return objectKey;
        }
        return publicBaseUrl + "/uploads/" + normalizeObjectKey(objectKey);
    }

    public String resourceLocation() {
        String location = uploadRoot.toUri().toString();
        return location.endsWith("/") ? location : location + "/";
    }

    public Path getUploadRoot() {
        return uploadRoot;
    }

    private void validateFile(MultipartFile file, long maxSize, Set<String> allowedContentTypes) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File không được để trống");
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException("Kích thước file vượt quá giới hạn cho phép");
        }
        if (file.getContentType() == null || !allowedContentTypes.contains(file.getContentType())
                || !EXTENSIONS.containsKey(file.getContentType())) {
            throw new BadRequestException("Định dạng ảnh không được hỗ trợ");
        }
    }

    private Path resolveObjectKey(String objectKey) {
        Path target = uploadRoot.resolve(objectKey).normalize().toAbsolutePath();
        if (!target.startsWith(uploadRoot)) {
            throw new BadRequestException("Đường dẫn upload không hợp lệ");
        }
        return target;
    }

    private Path resolveUploadRoot(String configuredUploadDir) {
        if (configuredUploadDir != null && !configuredUploadDir.isBlank()) {
            return Paths.get(configuredUploadDir).toAbsolutePath().normalize();
        }
        try {
            Path location = Paths.get(ImageStorageService.class.getProtectionDomain()
                            .getCodeSource().getLocation().toURI())
                    .toAbsolutePath().normalize();
            Path current = Files.isDirectory(location) ? location : location.getParent();
            while (current != null) {
                if (Files.isRegularFile(current.resolve("pom.xml"))) {
                    return current.resolve("uploads").toAbsolutePath().normalize();
                }
                current = current.getParent();
            }
        } catch (URISyntaxException | RuntimeException exception) {
            logger.warn("Could not derive backend upload directory from code location", exception);
        }
        return Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();
    }

    private String normalizeBaseUrl(String configuredPublicBaseUrl, String serverPort) {
        String baseUrl = configuredPublicBaseUrl == null || configuredPublicBaseUrl.isBlank()
                ? "http://localhost:" + serverPort
                : configuredPublicBaseUrl.trim();
        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    private String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 không được hỗ trợ", exception);
        }
    }

    public record StoredImage(String objectKey, String sha256, String contentType, long size) {
    }
}
