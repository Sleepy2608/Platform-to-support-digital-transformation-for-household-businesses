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

    // Da bo co che key. Giu 2 endpoint duoi de frontend cu khong vo:
    // key-status luon bao da mo khoa, unlock chi seek lai.
    @GetMapping("/key-status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> keyStatus() {
        requireSeedUser();
        Map<String, Boolean> status = Map.of(
                "initialized", true,
                "unlocked", true
        );
        return ResponseEntity.ok(ApiResponse.success("Trạng thái key", status));
    }

    @PostMapping("/unlock")
    public ResponseEntity<ApiResponse<Integer>> unlock(@RequestBody(required = false) Map<String, String> body) {
        requireSeedUser();
        int restored = seedService.restoreAll();
        return ResponseEntity.ok(ApiResponse.success("Đã seek", restored));
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
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot", seedService.snapshot(table)));
    }

    @PostMapping("/snapshot-all")
    public ResponseEntity<ApiResponse<List<SeedConfig>>> snapshotAll() {
        requireSeedUser();
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot tất cả", seedService.snapshotAll()));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<Integer>> restore() {
        requireSeedUser();
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
