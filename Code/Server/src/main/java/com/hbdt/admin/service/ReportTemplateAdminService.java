package com.hbdt.admin.service;

import com.hbdt.admin.dto.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.User;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import com.hbdt.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class ReportTemplateAdminService {
    private final ReportTemplateRepository templates;
    private final ReportTemplateVersionRepository versions;
    private final UserRepository users;

    public ReportTemplateAdminService(ReportTemplateRepository templates,
            ReportTemplateVersionRepository versions, UserRepository users) {
        this.templates = templates; this.versions = versions; this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ReportTemplateAdminResponse> list() {
        return templates.findAllByOrderByTemplateCodeAsc().stream()
                .map(t -> new ReportTemplateAdminResponse(t,
                        versions.findAllByReportTemplateIdOrderByEffectiveFromDesc(t.getId())))
                .toList();
    }

    @Transactional
    public ReportTemplateAdminResponse create(String username, ReportTemplateRequest request) {
        String code = request.templateCode().trim().toUpperCase(Locale.ROOT);
        if (templates.existsByTemplateCodeIgnoreCase(code)) {
            throw new BadRequestException("Mã biểu mẫu đã tồn tại");
        }
        User actor = requireUser(username);
        TemplateType templateType;
        try {
            templateType = TemplateType.valueOf(request.templateType().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Loại biểu mẫu không hợp lệ");
        }
        ReportTemplate saved = templates.save(ReportTemplate.builder().createdBy(actor.getId())
                .templateCode(code).templateName(request.templateName().trim())
                .templateType(templateType)
                .officialFormCode(trim(request.officialFormCode())).legalBasis(trim(request.legalBasis()))
                .description(trim(request.description())).status(TemplateStatus.ACTIVE).build());
        return new ReportTemplateAdminResponse(saved, List.of());
    }

    @Transactional
    public ReportTemplateAdminResponse addVersion(String username, Long templateId,
            ReportTemplateVersionRequest request) {
        ReportTemplate template = templates.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biểu mẫu"));
        if (request.effectiveTo() != null && request.effectiveTo().isBefore(request.effectiveFrom())) {
            throw new BadRequestException("Ngày kết thúc hiệu lực không được trước ngày bắt đầu");
        }
        Integer version = request.versionNumber();
        if (versions.existsByReportTemplateIdAndVersionNumber(templateId, version)) {
            throw new BadRequestException("Phiên bản biểu mẫu đã tồn tại");
        }
        List<ReportTemplateVersion> current = versions
                .findAllByReportTemplateIdOrderByEffectiveFromDesc(templateId);
        if (!current.isEmpty() && !request.effectiveFrom().isAfter(current.getFirst().getEffectiveFrom())) {
            throw new BadRequestException("Phiên bản mới phải có ngày hiệu lực sau phiên bản gần nhất");
        }
        if (!current.isEmpty()) {
            ReportTemplateVersion previous = current.getFirst();
            previous.setEffectiveTo(request.effectiveFrom().minusDays(1));
            previous.setStatus("INACTIVE");
            versions.save(previous);
        }
        User actor = requireUser(username);
        ReportTemplateVersion savedVersion = versions.save(ReportTemplateVersion.builder().reportTemplateId(templateId)
                .createdBy(actor.getId()).versionNumber(version).templateSchema(request.templateSchema())
                .effectiveFrom(request.effectiveFrom()).effectiveTo(request.effectiveTo())
                .status("ACTIVE").build());
        template.setCurrentVersionId(savedVersion.getId());
        templates.save(template);
        return new ReportTemplateAdminResponse(template,
                versions.findAllByReportTemplateIdOrderByEffectiveFromDesc(templateId));
    }

    private User requireUser(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản Admin"));
    }
    private String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
