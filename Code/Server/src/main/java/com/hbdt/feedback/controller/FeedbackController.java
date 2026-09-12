package com.hbdt.feedback.controller;

import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.entity.enums.FeedbackType;
import com.hbdt.feedback.dto.*;
import com.hbdt.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "updatedAt", "status", "feedbackType", "subject");

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    /** GET /api/feedback/types - Danh sách loại phản hồi hợp lệ */
    @GetMapping("/types")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FeedbackTypeOption>>> getFeedbackTypes() {
        List<FeedbackTypeOption> types = java.util.Arrays.stream(FeedbackType.values())
                .map(type -> new FeedbackTypeOption(type.name(), type.getLabel()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Lấy loại phản hồi thành công", types));
    }

    // ==================== USER ENDPOINTS ====================

    /** GET /api/feedback - Lấy danh sách phản hồi của người dùng hiện tại */
    @GetMapping
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getMyFeedbacks(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        var feedbacks = feedbackService.getMyFeedbacks(authentication.getName(), status, feedbackType, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách phản hồi thành công",
                PageResponse.from(feedbacks)));
    }

    /** POST /api/feedback - Tạo phản hồi mới */
    @PostMapping
    @PreAuthorize("hasAnyRole('BUSINESS_OWNER', 'OWNER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> createFeedback(
            Authentication authentication,
            @Valid @RequestBody FeedbackCreateRequest request) {

        var feedback = feedbackService.createFeedback(authentication.getName(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi phản hồi thành công", feedback));
    }

    /** GET /api/feedback/{id} - Lấy chi tiết phản hồi */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FeedbackResponse>> getFeedbackDetail(
            Authentication authentication,
            @PathVariable Long id) {

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy chi tiết phản hồi thành công",
                feedbackService.getFeedbackDetail(authentication.getName(), id)));
    }

    /** GET /api/feedback/{id}/history - Lấy lịch sử phản hồi */
    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FeedbackHistoryResponse>>> getFeedbackHistory(
            Authentication authentication,
            @PathVariable Long id) {

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy lịch sử phản hồi thành công",
                feedbackService.getFeedbackHistory(authentication.getName(), id)));
    }

    // ==================== MANAGER/ADMIN ENDPOINTS ====================

    /** GET /api/feedback/admin/all - Lấy tất cả phản hồi (ADMIN) */
    @GetMapping("/admin/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getAllFeedbacks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        var feedbacks = feedbackService.getAllFeedbacks(status, feedbackType, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách phản hồi thành công",
                PageResponse.from(feedbacks)));
    }

    /** GET /api/feedback/admin/business/{businessId} - Lấy phản hồi theo business */
    @GetMapping("/admin/business/{businessId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getBusinessFeedbacks(
            @PathVariable Long businessId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String feedbackType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        var feedbacks = feedbackService.getBusinessFeedbacks(businessId, status, feedbackType, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách phản hồi thành công",
                PageResponse.from(feedbacks)));
    }

    /** PUT /api/feedback/admin/{id}/status - Cập nhật trạng thái phản hồi */
    @PutMapping("/admin/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> updateFeedbackStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody FeedbackUpdateStatusRequest request) {

        var feedback = feedbackService.updateStatus(authentication.getName(), id, request);

        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", feedback));
    }

    /** POST /api/feedback/admin/{id}/response - Thêm phản hồi cho người dùng */
    @PostMapping("/admin/{id}/response")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<FeedbackResponse>> addFeedbackResponse(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody FeedbackResponseRequest request) {

        var feedback = feedbackService.addResponse(authentication.getName(), id, request);

        return ResponseEntity.ok(ApiResponse.success("Thêm phản hồi thành công", feedback));
    }

    // ==================== PRIVATE HELPERS ====================

    private Pageable createPageable(int page, int size, String sortBy, String sortDir) {
        if (page < 0) {
            throw new BadRequestException("Số trang không được nhỏ hơn 0");
        }
        if (size < 1 || size > 100) {
            throw new BadRequestException("Kích thước trang phải từ 1 đến 100");
        }
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException("Trường sắp xếp không hợp lệ");
        }
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
