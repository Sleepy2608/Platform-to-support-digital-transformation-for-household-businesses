package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.owner.dto.ValidateBypassKeyRequest;
import com.hbdt.owner.dto.ValidateBypassKeyResponse;
import com.hbdt.owner.service.OwnerBypassKeyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/bypass-keys")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
public class OwnerBypassKeyController {

    private final OwnerBypassKeyService ownerBypassKeyService;

    public OwnerBypassKeyController(OwnerBypassKeyService ownerBypassKeyService) {
        this.ownerBypassKeyService = ownerBypassKeyService;
    }

    /**
     * POST /api/owner/bypass-keys/validate
     * Kiểm tra tính hợp lệ của mã Bypass Key trước khi thực hiện xác nhận thanh toán.
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ValidateBypassKeyResponse>> validateKey(
            @Valid @RequestBody ValidateBypassKeyRequest request) {
        ValidateBypassKeyResponse response = ownerBypassKeyService.validateKey(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}

