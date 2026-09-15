package com.hbdt.admin.dto;

import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import java.util.List;

public record ReportTemplateAdminResponse(ReportTemplate template, List<ReportTemplateVersion> versions) { }
