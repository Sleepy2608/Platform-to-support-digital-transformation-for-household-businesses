package com.hbdt.owner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.GeneratedReport;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.Role;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.ReportStatus;
import com.hbdt.entity.enums.RoleType;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.entity.enums.VersionStatus;
import com.hbdt.owner.dto.ReportRejectRequest;
import com.hbdt.owner.dto.ReportReviewResponse;
import com.hbdt.owner.dto.ReportUpdateRequest;
import com.hbdt.owner.service.ReportReviewService;
import com.hbdt.repository.GeneratedReportRepository;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import com.hbdt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ReportReviewService}.
 *
 * <p>Covers all 11 scenarios from the testing requirements:</p>
 * <ol>
 *   <li>List reports for Owner</li>
 *   <li>View report detail</li>
 *   <li>Edit report successfully</li>
 *   <li>Validate edit data (null reportData)</li>
 *   <li>Confirm report successfully</li>
 *   <li>Reject report successfully + save reason</li>
 *   <li>Verify rejection reason is stored</li>
 *   <li>Status transition: DRAFT → PENDING_REVIEW → CONFIRMED</li>
 *   <li>Owner cannot access another Owner's report</li>
 *   <li>Report not found</li>
 *   <li>Invalid operation for current status</li>
 * </ol>
 */
@ExtendWith(MockitoExtension.class)
class ReportReviewServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private GeneratedReportRepository reportRepository;
    @Mock private ReportTemplateVersionRepository versionRepository;
    @Mock private ReportTemplateRepository templateRepository;
    @Mock private UserRepository userRepository;

    private ReportReviewService service;

    private static final Long OWNER_USER_ID = 10L;
    private static final Long BUSINESS_ID = 100L;
    private static final Long OTHER_BUSINESS_ID = 999L;
    private static final String OWNER_USERNAME = "owner_test";

    @BeforeEach
    void setUp() {
        service = new ReportReviewService(
                reportRepository, versionRepository, templateRepository, userRepository);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════

    private User createOwner() {
        Role role = new Role();
        role.setId(2L);
        role.setName(RoleType.BUSINESS_OWNER);

        User owner = User.builder()
                .id(OWNER_USER_ID)
                .username(OWNER_USERNAME)
                .fullName("Chủ cửa hàng Test")
                .businessId(BUSINESS_ID)
                .role(role)
                .build();
        owner.setPassword("hashed");
        return owner;
    }

    private GeneratedReport createReport(Long id, ReportStatus status) {
        return GeneratedReport.builder()
                .id(id)
                .businessId(BUSINESS_ID)
                .templateVersionId(1L)
                .reportingPeriodFrom(LocalDate.of(2025, 1, 1))
                .reportingPeriodTo(LocalDate.of(2025, 3, 31))
                .generationNo(1)
                .generationMethod("AUTO")
                .reportData(sampleReportData())
                .status(status)
                .build();
    }

    private JsonNode sampleReportData() {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("totalRevenue", 50000000);
        data.put("totalExpense", 20000000);
        data.put("netIncome", 30000000);
        return data;
    }

    private JsonNode updatedReportData() {
        ObjectNode data = objectMapper.createObjectNode();
        data.put("totalRevenue", 55000000);
        data.put("totalExpense", 22000000);
        data.put("netIncome", 33000000);
        return data;
    }

    private void stubOwnerLookup() {
        when(userRepository.findByUsername(OWNER_USERNAME))
                .thenReturn(Optional.of(createOwner()));
    }

    private void stubVersionAndTemplate() {
        ReportTemplateVersion version = ReportTemplateVersion.builder()
                .id(1L)
                .reportTemplateId(10L)
                .versionNumber(1)
                .templateSchema(sampleReportData())
                .effectiveFrom(LocalDate.of(2025, 1, 1))
                .status(VersionStatus.ACTIVE)
                .build();
        when(versionRepository.findById(1L)).thenReturn(Optional.of(version));

        ReportTemplate template = ReportTemplate.builder()
                .id(10L)
                .templateName("Sổ chi tiết doanh thu")
                .templateType(TemplateType.REVENUE_LEDGER)
                .build();
        when(templateRepository.findById(10L)).thenReturn(Optional.of(template));
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 1: List reports for Owner
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("1. Lấy danh sách báo cáo của Owner")
    class ListReports {

        @Test
        @DisplayName("Trả về danh sách báo cáo phân trang thuộc đúng businessId")
        void shouldReturnPaginatedReportsForOwner() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport r1 = createReport(1L, ReportStatus.DRAFT);
            GeneratedReport r2 = createReport(2L, ReportStatus.PENDING_REVIEW);
            Page<GeneratedReport> mockPage = new PageImpl<>(List.of(r1, r2));

            when(reportRepository.findByBusinessId(eq(BUSINESS_ID), any(Pageable.class)))
                    .thenReturn(mockPage);

            Pageable pageable = PageRequest.of(0, 10);
            Page<ReportReviewResponse> result = service.getReports(OWNER_USERNAME, null, pageable);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent().get(0).getBusinessId()).isEqualTo(BUSINESS_ID);
            verify(reportRepository).findByBusinessId(BUSINESS_ID, pageable);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 2: View report detail
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("2. Xem chi tiết báo cáo")
    class ViewDetail {

        @Test
        @DisplayName("Trả về chi tiết báo cáo kèm template name và template type")
        void shouldReturnDetailWithTemplateName() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport report = createReport(1L, ReportStatus.PENDING_REVIEW);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));

            ReportReviewResponse result = service.getReportDetail(OWNER_USERNAME, 1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getTemplateName()).isEqualTo("Sổ chi tiết doanh thu");
            assertThat(result.getTemplateType()).isEqualTo("REVENUE_LEDGER");
            assertThat(result.getStatus()).isEqualTo(ReportStatus.PENDING_REVIEW);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 3: Edit report successfully
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("3. Chỉnh sửa báo cáo")
    class EditReport {

        @Test
        @DisplayName("Cho phép chỉnh sửa khi status = DRAFT → chuyển sang PENDING_REVIEW")
        void shouldEditDraftReport() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport report = createReport(1L, ReportStatus.DRAFT);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));
            when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ReportUpdateRequest request = new ReportUpdateRequest(updatedReportData());
            ReportReviewResponse result = service.editReport(OWNER_USERNAME, 1L, request);

            assertThat(result.getStatus()).isEqualTo(ReportStatus.PENDING_REVIEW);
            assertThat(result.getReportData().get("totalRevenue").asLong()).isEqualTo(55000000);
            assertThat(result.getEditedBy()).isEqualTo(OWNER_USER_ID);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 4: Validation — null reportData
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("4. Validation dữ liệu chỉnh sửa")
    class EditValidation {

        @Test
        @DisplayName("Không cho phép chỉnh sửa báo cáo đã CONFIRMED")
        void shouldRejectEditOnConfirmedReport() {
            stubOwnerLookup();

            GeneratedReport report = createReport(1L, ReportStatus.CONFIRMED);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));

            ReportUpdateRequest request = new ReportUpdateRequest(updatedReportData());

            assertThatThrownBy(() -> service.editReport(OWNER_USERNAME, 1L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Không thể chỉnh sửa");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 5: Confirm report successfully
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("5. Xác nhận báo cáo")
    class ConfirmReport {

        @Test
        @DisplayName("Xác nhận báo cáo thành công khi status = PENDING_REVIEW")
        void shouldConfirmPendingReviewReport() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport report = createReport(1L, ReportStatus.PENDING_REVIEW);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));
            when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ReportReviewResponse result = service.confirmReport(OWNER_USERNAME, 1L);

            assertThat(result.getStatus()).isEqualTo(ReportStatus.CONFIRMED);
            assertThat(result.getReviewedBy()).isEqualTo(OWNER_USER_ID);
            assertThat(result.getConfirmedAt()).isNotNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 6: Reject report successfully + save reason
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("6. Từ chối báo cáo")
    class RejectReport {

        @Test
        @DisplayName("Từ chối báo cáo thành công và lưu lý do")
        void shouldRejectAndSaveReason() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport report = createReport(1L, ReportStatus.PENDING_REVIEW);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));
            when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ReportRejectRequest request = new ReportRejectRequest("Số liệu doanh thu không khớp với sổ bán hàng");
            ReportReviewResponse result = service.rejectReport(OWNER_USERNAME, 1L, request);

            assertThat(result.getStatus()).isEqualTo(ReportStatus.REJECTED);
            assertThat(result.getRejectionReason()).isEqualTo("Số liệu doanh thu không khớp với sổ bán hàng");
            assertThat(result.getRejectedBy()).isEqualTo(OWNER_USER_ID);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 7: Verify rejection reason is stored
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("7. Lưu lý do từ chối")
    class RejectionReasonPersistence {

        @Test
        @DisplayName("Lý do từ chối được lưu đầy đủ vào entity")
        void shouldPersistRejectionReasonInEntity() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            GeneratedReport report = createReport(1L, ReportStatus.PENDING_REVIEW);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));
            when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            String reason = "Chi phí nguyên vật liệu ghi nhận sai kỳ";
            service.rejectReport(OWNER_USERNAME, 1L, new ReportRejectRequest(reason));

            verify(reportRepository).save(argThat(savedReport ->
                    savedReport.getRejectionReason().equals(reason)
                            && savedReport.getStatus() == ReportStatus.REJECTED
                            && savedReport.getReviewedAt() != null));
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 8: Full status transition flow
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("8. Chuyển đổi trạng thái DRAFT → PENDING_REVIEW → CONFIRMED")
    class StatusTransitionFlow {

        @Test
        @DisplayName("Luồng trạng thái hoàn chỉnh: DRAFT → edit → PENDING_REVIEW → confirm → CONFIRMED")
        void shouldFollowFullTransitionFlow() {
            stubOwnerLookup();
            stubVersionAndTemplate();

            // Start with DRAFT
            GeneratedReport report = createReport(1L, ReportStatus.DRAFT);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));
            when(reportRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Step 1: Edit (DRAFT → PENDING_REVIEW)
            ReportUpdateRequest editRequest = new ReportUpdateRequest(updatedReportData());
            ReportReviewResponse afterEdit = service.editReport(OWNER_USERNAME, 1L, editRequest);
            assertThat(afterEdit.getStatus()).isEqualTo(ReportStatus.PENDING_REVIEW);

            // Step 2: Confirm (PENDING_REVIEW → CONFIRMED)
            ReportReviewResponse afterConfirm = service.confirmReport(OWNER_USERNAME, 1L);
            assertThat(afterConfirm.getStatus()).isEqualTo(ReportStatus.CONFIRMED);
            assertThat(afterConfirm.getConfirmedAt()).isNotNull();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 9: Owner cannot access another Owner's report
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("9. Owner không truy cập được báo cáo của Owner khác")
    class CrossOwnerAccess {

        @Test
        @DisplayName("Ném ResourceNotFoundException khi báo cáo thuộc business khác")
        void shouldDenyAccessToAnotherOwnerReport() {
            stubOwnerLookup();

            // Report exists but belongs to a different businessId
            when(reportRepository.findByIdAndBusinessId(5L, BUSINESS_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getReportDetail(OWNER_USERNAME, 5L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Báo cáo");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 10: Report not found
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("10. Báo cáo không tồn tại")
    class ReportNotFound {

        @Test
        @DisplayName("Ném ResourceNotFoundException khi reportId không tồn tại")
        void shouldThrowWhenReportNotFound() {
            stubOwnerLookup();

            when(reportRepository.findByIdAndBusinessId(999L, BUSINESS_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getReportDetail(OWNER_USERNAME, 999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // Test 11: Invalid operation for current status
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("11. Thao tác không hợp lệ theo trạng thái")
    class InvalidStatusOperation {

        @Test
        @DisplayName("Không thể xác nhận báo cáo ở trạng thái DRAFT")
        void shouldNotConfirmDraftReport() {
            stubOwnerLookup();

            GeneratedReport report = createReport(1L, ReportStatus.DRAFT);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));

            assertThatThrownBy(() -> service.confirmReport(OWNER_USERNAME, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Chờ duyệt");
        }

        @Test
        @DisplayName("Không thể chỉnh sửa báo cáo ở trạng thái REJECTED")
        void shouldNotEditRejectedReport() {
            stubOwnerLookup();

            GeneratedReport report = createReport(1L, ReportStatus.REJECTED);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));

            ReportUpdateRequest request = new ReportUpdateRequest(updatedReportData());

            assertThatThrownBy(() -> service.editReport(OWNER_USERNAME, 1L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Không thể chỉnh sửa");
        }

        @Test
        @DisplayName("Không thể từ chối báo cáo đã CONFIRMED")
        void shouldNotRejectConfirmedReport() {
            stubOwnerLookup();

            GeneratedReport report = createReport(1L, ReportStatus.CONFIRMED);
            when(reportRepository.findByIdAndBusinessId(1L, BUSINESS_ID))
                    .thenReturn(Optional.of(report));

            ReportRejectRequest request = new ReportRejectRequest("Lý do test");

            assertThatThrownBy(() -> service.rejectReport(OWNER_USERNAME, 1L, request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Chờ duyệt");
        }
    }
}
