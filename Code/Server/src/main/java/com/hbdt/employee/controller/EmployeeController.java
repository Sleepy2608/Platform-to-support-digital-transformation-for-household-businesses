package com.hbdt.employee.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.employee.dto.*;
import com.hbdt.employee.service.EmployeeService;
import com.hbdt.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller — Owner quản lý tài khoản nhân viên (HBDT-03.4).
 * Mọi endpoint yêu cầu vai trò BUSINESS_OWNER (được chặn bởi SecurityConfig /api/owner/**).
 * Mọi thao tác đều giới hạn trong phạm vi businessId của Owner đang đăng nhập.
 */
@RestController
@RequestMapping("/api/owner/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /**
     * GET /api/owner/employees?search=keyword
     * Danh sách nhân viên của hộ kinh doanh hiện tại (hỗ trợ tìm kiếm).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> listEmployees(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String search) {
        List<EmployeeResponse> employees = employeeService.listEmployees(currentUser.getBusinessId(), search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân viên thành công", employees));
    }

    /**
     * GET /api/owner/employees/{id}
     * Chi tiết một nhân viên.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        EmployeeResponse employee = employeeService.getEmployee(currentUser.getBusinessId(), id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhân viên thành công", employee));
    }

    /**
     * POST /api/owner/employees
     * Tạo mới tài khoản nhân viên.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody EmployeeCreateRequest request,
            HttpServletRequest httpRequest) {
        EmployeeResponse employee = employeeService.createEmployee(
                currentUser.getId(), currentUser.getBusinessId(), request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhân viên thành công", employee));
    }

    /**
     * PUT /api/owner/employees/{id}
     * Cập nhật thông tin nhân viên (họ tên, chức vụ, trạng thái, ngày nghỉ).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request,
            HttpServletRequest httpRequest) {
        EmployeeResponse employee = employeeService.updateEmployee(
                currentUser.getId(), currentUser.getBusinessId(), id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhân viên thành công", employee));
    }

    /**
     * DELETE /api/owner/employees/{id}
     * Xóa nhân viên (soft-delete).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        employeeService.deleteEmployee(currentUser.getId(), currentUser.getBusinessId(), id, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Xóa nhân viên thành công", null));
    }

    /**
     * POST /api/owner/employees/{id}/reset-password
     * Đặt lại mật khẩu cho nhân viên.
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        employeeService.resetPassword(currentUser.getId(), currentUser.getBusinessId(), id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Đặt lại mật khẩu thành công", null));
    }

    /**
     * POST /api/owner/employees/{id}/lock
     * Khóa tài khoản nhân viên.
     */
    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Void>> lockEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        employeeService.lockEmployee(currentUser.getId(), currentUser.getBusinessId(), id, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Khóa tài khoản nhân viên thành công", null));
    }

    /**
     * POST /api/owner/employees/{id}/unlock
     * Mở khóa tài khoản nhân viên.
     */
    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockEmployee(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        employeeService.unlockEmployee(currentUser.getId(), currentUser.getBusinessId(), id, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Mở khóa tài khoản nhân viên thành công", null));
    }
}
