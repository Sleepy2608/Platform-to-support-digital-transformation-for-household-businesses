package com.hbdt.seed.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.seed.entity.SeedConfig;
import com.hbdt.seed.service.SeedCrypto;
import com.hbdt.seed.service.SeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seed")
public class SeedController {

    private static final String SEED_USERNAME = "Admin";

    private final SeedService seedService;
    private final SeedCrypto seedCrypto;

    public SeedController(SeedService seedService, SeedCrypto seedCrypto) {
        this.seedService = seedService;
        this.seedCrypto = seedCrypto;
    }

    private void requireSeedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !SEED_USERNAME.equals(auth.getName())) {
            throw new AccessDeniedException("Không có quyền truy cập");
        }
    }

    private void requireUnlocked() {
        if (!seedCrypto.isUnlocked()) {
            throw new IllegalStateException("Chưa nhập key để mở khóa seek data");
        }
    }

    @GetMapping("/key-status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> keyStatus() {
        requireSeedUser();
        Map<String, Boolean> status = Map.of(
                "initialized", seedCrypto.isKeyInitialized(),
                "unlocked", seedCrypto.isUnlocked()
        );
        return ResponseEntity.ok(ApiResponse.success("Trạng thái key", status));
    }

    @PostMapping("/unlock")
    public ResponseEntity<ApiResponse<Integer>> unlock(@RequestBody Map<String, String> body) {
        requireSeedUser();
        String key = body.get("key");
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Key không được để trống");
        }
        seedCrypto.unlock(key);
        int restored = seedService.restoreAll();
        return ResponseEntity.ok(ApiResponse.success("Đã mở khóa và seek", restored));
    }

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<String>>> tables() {
        requireSeedUser();
        return ResponseEntity.ok(ApiResponse.success("Danh sách bảng", seedService.listTables()));
    }

    @GetMapping("/configs")
    public ResponseEntity<ApiResponse<List<SeedConfig>>> configs() {
        requireSeedUser();
        return ResponseEntity.ok(ApiResponse.success("Danh sách seek", seedService.listConfigs()));
    }

    @PostMapping("/snapshot")
    public ResponseEntity<ApiResponse<SeedConfig>> snapshot(@RequestParam String table) {
        requireSeedUser();
        requireUnlocked();
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot", seedService.snapshot(table)));
    }

    @PostMapping("/snapshot-all")
    public ResponseEntity<ApiResponse<List<SeedConfig>>> snapshotAll() {
        requireSeedUser();
        requireUnlocked();
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot tất cả", seedService.snapshotAll()));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<Integer>> restore() {
        requireSeedUser();
        requireUnlocked();
        return ResponseEntity.ok(ApiResponse.success("Đã seek", seedService.restoreAll()));
    }

    @PatchMapping("/configs/{id}/enabled")
    public ResponseEntity<ApiResponse<SeedConfig>> setEnabled(@PathVariable Long id, @RequestParam boolean value) {
        requireSeedUser();
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật", seedService.setEnabled(id, value)));
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        requireSeedUser();
        seedService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa", null));
    }
}
