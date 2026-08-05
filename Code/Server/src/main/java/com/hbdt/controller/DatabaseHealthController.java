package com.hbdt.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@Profile("dev")
public class DatabaseHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/database-health")
    public ResponseEntity<Map<String, Object>> checkDatabase() {
        Integer ping = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        String database = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()",
                Integer.class
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", ping != null && ping == 1 ? "CONNECTED" : "ERROR");
        result.put("message", "Backend đã kết nối MySQL thành công");
        result.put("database", database);
        result.put("tableCount", tableCount);
        result.put("checkedAt", LocalDateTime.now());
        return ResponseEntity.ok(result);
    }
}
