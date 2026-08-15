package com.hbdt.seed.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.seed.entity.SeedConfig;
import com.hbdt.seed.service.SeedCrypto;
import com.hbdt.seed.service.SeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * SeedController – chỉ HEAD_ADMIN được truy cập.
 * SecurityConfig đã bảo vệ /api/seed/** bằng hasRole("HEAD_ADMIN"),
 * @PreAuthorize thêm một lớp bảo vệ rõ ràng ở method level.
 */
@RestController
@RequestMapping("/api/seed")
@PreAuthorize("hasRole('HEAD_ADMIN')")
public class SeedController {

    private final SeedService seedService;
    private final SeedCrypto seedCrypto;

    public SeedController(SeedService seedService, SeedCrypto seedCrypto) {
        this.seedService = seedService;
        this.seedCrypto = seedCrypto;
    }

    // Da bo co che key. Giu 2 endpoint duoi de frontend cu khong vo:
    // key-status luon bao da mo khoa, unlock chi seek lai.
    @GetMapping("/key-status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> keyStatus() {
        Map<String, Boolean> status = Map.of(
                "initialized", true,
                "unlocked", true
        );
        return ResponseEntity.ok(ApiResponse.success("Trạng thái key", status));
    }

    @PostMapping("/unlock")
    public ResponseEntity<ApiResponse<Integer>> unlock(@RequestBody(required = false) Map<String, String> body) {
        int restored = seedService.restoreAll();
        return ResponseEntity.ok(ApiResponse.success("Đã seek", restored));
    }

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<String>>> tables() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách bảng", seedService.listTables()));
    }

    @GetMapping("/configs")
    public ResponseEntity<ApiResponse<List<SeedConfig>>> configs() {
        return ResponseEntity.ok(ApiResponse.success("Danh sách seek", seedService.listConfigs()));
    }

    @PostMapping("/snapshot")
    public ResponseEntity<ApiResponse<SeedConfig>> snapshot(@RequestParam String table) {
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot", seedService.snapshot(table)));
    }

    @PostMapping("/snapshot-all")
    public ResponseEntity<ApiResponse<List<SeedConfig>>> snapshotAll() {
        return ResponseEntity.ok(ApiResponse.success("Đã snapshot tất cả", seedService.snapshotAll()));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<Integer>> restore() {
        return ResponseEntity.ok(ApiResponse.success("Đã seek", seedService.restoreAll()));
    }

    @PatchMapping("/configs/{id}/enabled")
    public ResponseEntity<ApiResponse<SeedConfig>> setEnabled(@PathVariable Long id, @RequestParam boolean value) {
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật", seedService.setEnabled(id, value)));
    }

    @DeleteMapping("/configs/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        seedService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa", null));
    }
}
