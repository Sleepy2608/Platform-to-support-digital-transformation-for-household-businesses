package com.hbdt.manager.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.manager.dto.BusinessOwnerResponse;
import com.hbdt.manager.dto.BusinessOwnerStatusRequest;
import com.hbdt.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Manager quản lý trạng thái các tài khoản chủ hộ kinh doanh. */
@RestController
@RequestMapping("/api/manager/business-owners")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerBusinessOwnerController {

    private final UserRepository userRepository;

    public ManagerBusinessOwnerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessOwnerResponse>>> getBusinessOwners() {
        List<BusinessOwnerResponse> owners = userRepository.findByRoleType(RoleType.BUSINESS_OWNER)
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chủ hộ kinh doanh thành công", owners));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BusinessOwnerResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody BusinessOwnerStatusRequest request) {
        if (request.getStatus() != UserStatus.ACTIVE && request.getStatus() != UserStatus.LOCKED) {
            throw new BadRequestException("Manager chỉ được phép khóa hoặc mở khóa tài khoản chủ hộ");
        }

        User owner = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản chủ hộ kinh doanh"));
        if (owner.getRole() == null || owner.getRole().getName() != RoleType.BUSINESS_OWNER) {
            throw new BadRequestException("Chỉ được phép thao tác trên tài khoản chủ hộ kinh doanh");
        }

        owner.setStatus(request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(
                request.getStatus() == UserStatus.LOCKED ? "Đã khóa tài khoản chủ hộ" : "Đã mở khóa tài khoản chủ hộ",
                toResponse(userRepository.save(owner))));
    }

    private BusinessOwnerResponse toResponse(User owner) {
        return BusinessOwnerResponse.builder()
                .id(owner.getId())
                .username(owner.getUsername())
                .fullName(owner.getFullName())
                .email(owner.getEmail())
                .phone(owner.getPhone())
                .status(owner.getStatus())
                .businessId(owner.getBusinessId())
                .createdAt(owner.getCreatedAt())
                .build();
    }
}
