package com.hbdt.owner.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.entity.enums.UserStatus;
import com.hbdt.owner.dto.*;
import com.hbdt.owner.service.EmployeeManagementService;
import com.hbdt.entitlement.annotation.RequireFeature;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller cho Owner quản lý tài khoản nhân viên (HBDT-14 + HBDT-114).
 * Tất cả endpoint yêu cầu role BUSINESS_OWNER hoặc OWNER.
 */
@RestController
@RequestMapping("/api/owner/employees")
@PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER')")
@RequireFeature("EMPLOYEE_MANAGEMENT")
public class EmployeeManagementController {

        private final EmployeeManagementService employeeManagementService;

        public EmployeeManagementController(EmployeeManagementService employeeManagementService) {
                this.employeeManagementService = employeeManagementService;
        }

        // =========================================================
        // CRUD
        // =========================================================

        /**
         * POST /api/owner/employees
         * Tạo tài khoản nhân viên mới.
         */
        @PostMapping
        public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @Valid @RequestBody CreateEmployeeRequest request) {
                EmployeeResponse response = employeeManagementService.createEmployee(
                                userDetails.getUsername(), request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Tạo tài khoản nhân viên thành công", response));
        }

        /**
         * GET /api/owner/employees?keyword=&status=&page=0&size=10
         * Danh sách nhân viên có phân trang và tìm kiếm.
         */
        @GetMapping
        public ResponseEntity<ApiResponse<EmployeeListResponse>> listEmployees(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) UserStatus status,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {
                EmployeeListResponse response = employeeManagementService.listEmployees(
                                userDetails.getUsername(), keyword, status, page, size);
                return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhân viên thành công", response));
        }

        /**
         * GET /api/owner/employees/{employeeId}
         * Xem chi tiết nhân viên.
         */
        @GetMapping("/{employeeId}")
        public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId) {
                EmployeeResponse response = employeeManagementService.getEmployee(
                                userDetails.getUsername(), employeeId);
                return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nhân viên thành công", response));
        }

        /**
         * PUT /api/owner/employees/{employeeId}
         * Cập nhật thông tin nhân viên (chức vụ, trạng thái, ngày nghỉ, v.v.).
         */
        @PutMapping("/{employeeId}")
        public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId,
                        @Valid @RequestBody UpdateEmployeeRequest request) {
                EmployeeResponse response = employeeManagementService.updateEmployee(
                                userDetails.getUsername(), employeeId, request);
                return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin nhân viên thành công", response));
        }

        /**
         * DELETE /api/owner/employees/{employeeId}
         * Xóa nhân viên (soft delete).
         */
        @DeleteMapping("/{employeeId}")
        public ResponseEntity<ApiResponse<Void>> deleteEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId) {
                employeeManagementService.deleteEmployee(userDetails.getUsername(), employeeId);
                return ResponseEntity.ok(ApiResponse.success("Đã xóa tài khoản nhân viên", null));
        }

        // =========================================================
        // Lock / Unlock
        // =========================================================

        /**
         * POST /api/owner/employees/{employeeId}/lock
         * Khóa tài khoản nhân viên.
         */
        @PostMapping("/{employeeId}/lock")
        public ResponseEntity<ApiResponse<EmployeeResponse>> lockEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId) {
                EmployeeResponse response = employeeManagementService.lockEmployee(
                                userDetails.getUsername(), employeeId);
                return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản nhân viên", response));
        }

        /**
         * POST /api/owner/employees/{employeeId}/unlock
         * Mở khóa tài khoản nhân viên.
         */
        @PostMapping("/{employeeId}/unlock")
        public ResponseEntity<ApiResponse<EmployeeResponse>> unlockEmployee(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId) {
                EmployeeResponse response = employeeManagementService.unlockEmployee(
                                userDetails.getUsername(), employeeId);
                return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản nhân viên", response));
        }

        // =========================================================
        // Reset Password
        // =========================================================

        /**
         * POST /api/owner/employees/{employeeId}/reset-password
         * Reset mật khẩu nhân viên, trả về mật khẩu tạm thời.
         */
        @PostMapping("/{employeeId}/reset-password")
        public ResponseEntity<ApiResponse<ResetPasswordResponse>> resetPassword(
                        @AuthenticationPrincipal UserDetails userDetails,
                        @PathVariable Long employeeId) {
                ResetPasswordResponse response = employeeManagementService.resetEmployeePassword(
                                userDetails.getUsername(), employeeId);
                return ResponseEntity.ok(ApiResponse.success(
                                "Đặt lại mật khẩu thành công. Hãy thông báo mật khẩu tạm thời cho nhân viên.",
                                response));
        }
}
