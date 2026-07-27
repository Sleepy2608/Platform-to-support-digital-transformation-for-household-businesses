package com.household.platform.auth;

import com.household.platform.common.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Stub endpoint — implementation đầy đủ ở SCRUM-14 (Login & Token Authentication).
 */
@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    @GetMapping("/status")
    public ApiResponse<Map<String, String>> status() {
        return ApiResponse.ok("Auth module sẵn sàng (skeleton)", Map.of(
                "module", "auth",
                "status", "SKELETON",
                "next", "SCRUM-14 Login & Token Authentication"
        ));
    }
}
