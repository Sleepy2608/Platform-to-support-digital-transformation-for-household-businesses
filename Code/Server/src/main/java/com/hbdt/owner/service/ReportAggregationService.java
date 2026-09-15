package com.hbdt.owner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.*;
import com.hbdt.entity.enums.AccountingTransactionStatus;
import com.hbdt.entity.enums.ReportStatus;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.order.event.SalesBookkeepingEvent;
import com.hbdt.owner.dto.ReportReviewResponse;
import com.hbdt.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Service cầu nối (Bridge/Aggregator) giữa tầng Bút toán thời gian thực (HBDT-59)
 * và tầng Báo cáo tài chính & Phê duyệt (HBDT-94).
 *
 * <p>Nhiệm vụ:
 * <ul>
 *   <li>Tự động tổng hợp số liệu từ {@code AccountingTransaction} vào {@code GeneratedReport}.</li>
 *   <li>Lắng nghe sự kiện {@link SalesBookkeepingEvent} để tự động làm mới báo cáo sau khi có đơn hàng mới.</li>
 *   <li>Cung cấp API cho Owner chủ động yêu cầu hệ thống tổng hợp báo cáo kỳ này trên giao diện web.</li>
 * </ul>
 */
@Service
public class ReportAggregationService {

    private static final Logger log = LoggerFactory.getLogger(ReportAggregationService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final GeneratedReportRepository reportRepository;
    private final ReportTemplateRepository templateRepository;
    private final ReportTemplateVersionRepository versionRepository;
    private final AccountingTransactionRepository accountingTransactionRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ReportReviewService reportReviewService;
    private final ObjectMapper objectMapper;

    public ReportAggregationService(GeneratedReportRepository reportRepository,
                                    ReportTemplateRepository templateRepository,
                                    ReportTemplateVersionRepository versionRepository,
                                    AccountingTransactionRepository accountingTransactionRepository,
                                    CustomerRepository customerRepository,
                                    UserRepository userRepository,
                                    ReportReviewService reportReviewService,
                                    ObjectMapper objectMapper) {
        this.reportRepository = reportRepository;
        this.templateRepository = templateRepository;
        this.versionRepository = versionRepository;
        this.accountingTransactionRepository = accountingTransactionRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.reportReviewService = reportReviewService;
        this.objectMapper = objectMapper;
    }

    /**
     * Lắng nghe sự kiện ghi sổ bán hàng thành công (chạy sau khi transaction đơn hàng commit).
     * Tự động tổng hợp / cập nhật báo cáo tài chính của tháng hiện tại cho hộ kinh doanh.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSalesBookkept(SalesBookkeepingEvent event) {
        log.info("[ReportBridge] Đã nhận sự kiện bán hàng #{} của hộ kinh doanh #{}. Bắt đầu tự động cập nhật báo cáo...",
                event.getOrderId(), event.getBusinessId());
        try {
            LocalDate now = LocalDate.now();
            LocalDate fromDate = now.withDayOfMonth(1);
            LocalDate toDate = now.withDayOfMonth(now.lengthOfMonth());
            aggregateRevenueLedgerReport(event.getBusinessId(), fromDate, toDate, null);
            log.info("[ReportBridge] Cập nhật báo cáo tự động thành công cho hộ kinh doanh #{}", event.getBusinessId());
        } catch (Exception e) {
            log.warn("[ReportBridge] Lỗi khi tự động cập nhật báo cáo sau đơn hàng: {}", e.getMessage());
        }
    }

    /**
     * Owner chủ động yêu cầu tổng hợp báo cáo từ giao diện web (On-demand).
     *
     * @param username tài khoản Owner
     * @param fromDate ngày bắt đầu kỳ (mặc định đầu tháng)
     * @param toDate   ngày kết thúc kỳ (mặc định cuối tháng)
     */
    @Transactional
    public ReportReviewResponse generateReportForOwner(String username, LocalDate fromDate, LocalDate toDate) {
        log.info("[ReportBridge] Owner '{}' yêu cầu tổng hợp báo cáo cho kỳ từ {} đến {}", username, fromDate, toDate);
        User owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        Long businessId = owner.getBusinessId();
        if (businessId == null) {
            throw new IllegalArgumentException("Tài khoản của bạn chưa được liên kết với Hộ kinh doanh nào");
        }

        LocalDate now = LocalDate.now();
        LocalDate effectiveFrom = fromDate != null ? fromDate : now.withDayOfMonth(1);
        LocalDate effectiveTo = toDate != null ? toDate : now.withDayOfMonth(now.lengthOfMonth());

        // Kiểm tra xem có bút toán phát sinh trong kỳ không
        LocalDateTime startDateTime = effectiveFrom.atStartOfDay();
        LocalDateTime endDateTime = effectiveTo.atTime(23, 59, 59);

        List<AccountingTransaction> transactions = accountingTransactionRepository
                .findAllByBusinessIdAndStatusAndCreatedAtBetween(
                        businessId,
                        AccountingTransactionStatus.COMPLETED,
                        startDateTime,
                        endDateTime
                );

        if (transactions.isEmpty()) {
            // Nếu chưa có phát sinh MÀ cũng chưa có báo cáo nào tồn tại cho kỳ này -> Từ chối tạo
            // Nếu đã có báo cáo rồi (đang DRAFT/PENDING_REVIEW) -> Cho phép đồng bộ lại (cập nhật số liệu)
            ReportTemplate template = templateRepository
                    .findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE)
                    .or(() -> templateRepository.findFirstByTemplateType(TemplateType.REVENUE_LEDGER))
                    .orElse(null);

            boolean hasExistingReport = false;
            if (template != null && template.getCurrentVersionId() != null) {
                hasExistingReport = reportRepository
                        .findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
                                businessId,
                                template.getCurrentVersionId(),
                                effectiveFrom,
                                effectiveTo,
                                List.of(ReportStatus.DRAFT, ReportStatus.PENDING_REVIEW)
                        ).isPresent();
            }

            if (!hasExistingReport) {
                throw new com.hbdt.common.exception.BadRequestException(
                        "Chưa có phát sinh bút toán bán hàng nào trong kỳ "
                        + effectiveFrom.format(DATE_FORMATTER) + " đến " + effectiveTo.format(DATE_FORMATTER)
                        + ". Hãy tạo đơn hàng trước khi tổng hợp báo cáo.");
            }
        }

        try {
            GeneratedReport report = aggregateRevenueLedgerReport(businessId, effectiveFrom, effectiveTo, owner.getId());
            return reportReviewService.toResponse(report);
        } catch (Exception e) {
            log.error("[ReportBridge] Lỗi trong quá trình tổng hợp báo cáo cho owner='{}': {}", username, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Thực hiện logic tổng hợp dữ liệu bút toán thành bản ghi GeneratedReport.
     */
    @Transactional
    public GeneratedReport aggregateRevenueLedgerReport(Long businessId,
                                                        LocalDate fromDate,
                                                        LocalDate toDate,
                                                        Long userId) {
        // 1. Tìm template Sổ doanh thu (REVENUE_LEDGER)
        ReportTemplate template = templateRepository
                .findByTemplateTypeAndStatus(TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE)
                .or(() -> templateRepository.findFirstByTemplateType(TemplateType.REVENUE_LEDGER))
                .or(() -> templateRepository.findAll().stream().filter(t -> t.getStatus() == TemplateStatus.ACTIVE).findFirst())
                .or(() -> templateRepository.findAll().stream().findFirst())
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có mẫu báo cáo tài chính nào."));

        // 2. Tìm phiên bản hợp lệ của mẫu biểu
        Long versionId = template.getCurrentVersionId();
        if (versionId == null) {
            versionId = versionRepository
                    .findTopByReportTemplateIdOrderByVersionNumberDesc(template.getId())
                    .map(ReportTemplateVersion::getId)
                    .orElse(null);
        }
        if (versionId == null) {
            versionId = versionRepository.findAll().stream().findFirst()
                    .map(ReportTemplateVersion::getId)
                    .orElseGet(() -> {
                        ReportTemplateVersion fallbackVersion = ReportTemplateVersion.builder()
                                .reportTemplateId(template.getId())
                                .versionNumber(1)
                                .status(com.hbdt.entity.enums.VersionStatus.ACTIVE)
                                .effectiveFrom(LocalDate.now())
                                .templateSchema(objectMapper.createObjectNode())
                                .changeSummary("Phiên bản khởi tạo hệ thống")
                                .build();
                        ReportTemplateVersion savedVersion = versionRepository.save(fallbackVersion);
                        template.setCurrentVersionId(savedVersion.getId());
                        templateRepository.save(template);
                        return savedVersion.getId();
                    });
        }

        // 3. Truy vấn các bút toán bán hàng trong kỳ
        LocalDateTime startDateTime = fromDate.atStartOfDay();
        LocalDateTime endDateTime = toDate.atTime(23, 59, 59);

        List<AccountingTransaction> transactions = accountingTransactionRepository
                .findAllByBusinessIdAndStatusAndCreatedAtBetween(
                        businessId,
                        AccountingTransactionStatus.COMPLETED,
                        startDateTime,
                        endDateTime
                );

        // 4. Đóng gói dữ liệu reportData (dạng Array dòng chứng từ theo Thông tư 88)
        JsonNode reportData;
        if (!transactions.isEmpty()) {
            ArrayNode rows = objectMapper.createArrayNode();
            int stt = 1;
            for (AccountingTransaction tx : transactions) {
                ObjectNode row = objectMapper.createObjectNode();
                row.put("STT", stt++);
                row.put("Ngày ghi chứng từ", tx.getCreatedAt().format(DATE_FORMATTER));
                row.put("Số hiệu hóa đơn / chứng từ", "DH-" + tx.getOrderId());

                String customerName = "Khách vãng lai";
                if (tx.getCustomerId() != null) {
                    customerName = customerRepository.findById(tx.getCustomerId())
                            .map(Customer::getCustomerName)
                            .orElse("Khách #" + tx.getCustomerId());
                }
                row.put("Họ tên người mua hàng", customerName);
                row.put("Tên mặt hàng / Diễn giải", "Bán hàng theo đơn #" + tx.getOrderId());
                row.put("Doanh thu bán hàng", tx.getTotalAmount());
                row.put("Đã thanh toán", tx.getPaidAmount());
                row.put("Tiền còn nợ", tx.getDebtAmount());
                row.put("Phương thức thanh toán", tx.getPaymentMethod() != null ? tx.getPaymentMethod().name() : "TIỀN MẶT");
                rows.add(row);
            }
            reportData = rows;
        } else {
            // Trường hợp chưa có đơn hàng: Tạo bản tóm tắt khởi đầu cho kỳ
            ObjectNode summary = objectMapper.createObjectNode();
            summary.put("Kỳ báo cáo", fromDate.format(DATE_FORMATTER) + " đến " + toDate.format(DATE_FORMATTER));
            summary.put("Tổng doanh thu bán hàng", 0);
            summary.put("Tiền đã thanh toán", 0);
            summary.put("Tổng công nợ phát sinh", 0);
            summary.put("Số lượng giao dịch", 0);
            summary.put("Trạng thái", "Sẵn sàng (Chưa có phát sinh bút toán bán hàng trong kỳ)");
            reportData = summary;
        }

        // 5. Kiểm tra nếu đã có báo cáo ở trạng thái DRAFT hoặc PENDING_REVIEW trong kỳ này
        Optional<GeneratedReport> existingReportOpt = reportRepository
                .findFirstByBusinessIdAndTemplateVersionIdAndReportingPeriodFromAndReportingPeriodToAndStatusInOrderByGenerationNoDesc(
                        businessId,
                        versionId,
                        fromDate,
                        toDate,
                        List.of(ReportStatus.DRAFT, ReportStatus.PENDING_REVIEW)
                );

        if (existingReportOpt.isPresent()) {
            GeneratedReport existing = existingReportOpt.get();
            existing.setReportData(reportData);
            existing.setEditedAt(LocalDateTime.now());
            existing.setStatus(ReportStatus.PENDING_REVIEW);
            log.info("[ReportBridge] Cập nhật số liệu mới nhất cho báo cáo hiện hữu #{}", existing.getId());
            return reportRepository.save(existing);
        }

        // 6. Nếu chưa có hoặc các bản trước đã CONFIRMED / REJECTED -> Tạo bản ghi mới với generationNo kế tiếp
        Integer maxGen = reportRepository.findMaxGenerationNo(businessId, versionId, fromDate, toDate);
        int nextGenNo = (maxGen != null ? maxGen : 0) + 1;

        GeneratedReport newReport = GeneratedReport.builder()
                .businessId(businessId)
                .templateVersionId(versionId)
                .reportingPeriodFrom(fromDate)
                .reportingPeriodTo(toDate)
                .generationNo(nextGenNo)
                .generationMethod("AUTOMATIC")
                .reportData(reportData)
                .status(ReportStatus.PENDING_REVIEW)
                .createdBy(userId != null ? userId : 1L)
                .build();

        GeneratedReport saved = reportRepository.save(newReport);
        log.info("[ReportBridge] Đã tạo mới báo cáo tài chính #{} cho kỳ {} đến {} của businessId={}",
                saved.getId(), fromDate, toDate, businessId);
        return saved;
    }
}
