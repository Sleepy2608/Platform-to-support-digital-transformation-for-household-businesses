package com.hbdt.owner.controller;

import com.hbdt.admin.dto.template.TemplateListResponse;
import com.hbdt.admin.dto.template.TemplateResponse;
import com.hbdt.admin.service.FinancialTemplateService;
import com.hbdt.common.dto.ApiResponse;
import com.hbdt.common.dto.PageResponse;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * RBAC and unit tests for {@link OwnerTemplateController}.
 * Ensures owner read-only security contract and correct service delegation.
 */
@ExtendWith(MockitoExtension.class)
class OwnerTemplateControllerTest {

    @Mock
    private FinancialTemplateService templateService;

    private OwnerTemplateController controller;

    @BeforeEach
    void setUp() {
        controller = new OwnerTemplateController(templateService);
    }

    @Test
    @DisplayName("RBAC: OwnerTemplateController must be restricted to BUSINESS_OWNER and OWNER")
    void controller_mustHaveOwnerPreAuthorize() {
        PreAuthorize preAuth = OwnerTemplateController.class.getAnnotation(PreAuthorize.class);
        assertThat(preAuth).isNotNull();
        assertThat(preAuth.value())
                .contains("BUSINESS_OWNER")
                .contains("OWNER");
    }

    @Test
    @DisplayName("RBAC: RequestMapping must use /api/owner/templates prefix")
    void controller_mustUseOwnerApiPrefix() {
        RequestMapping mapping = OwnerTemplateController.class.getAnnotation(RequestMapping.class);
        assertThat(mapping).isNotNull();
        assertThat(mapping.value()).contains("/api/owner/templates");
    }

    @Test
    @DisplayName("Should retrieve active templates for Owner with filtering")
    void listTemplates_returnsActiveTemplates() {
        TemplateListResponse item = TemplateListResponse.builder()
                .id(1L)
                .templateCode("RL-001")
                .templateName("Revenue Ledger")
                .templateType(TemplateType.REVENUE_LEDGER)
                .currentVersionNumber(1)
                .status(TemplateStatus.ACTIVE)
                .build();
        Page<TemplateListResponse> page = new PageImpl<>(List.of(item));

        when(templateService.getList(eq(TemplateType.REVENUE_LEDGER), eq(TemplateStatus.ACTIVE), eq("search"), any(Pageable.class)))
                .thenReturn(page);

        ResponseEntity<ApiResponse<PageResponse<TemplateListResponse>>> response =
                controller.listTemplates(TemplateType.REVENUE_LEDGER, "search", 0, 10);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().content()).hasSize(1);
        assertThat(response.getBody().getData().content().get(0).getTemplateCode()).isEqualTo("RL-001");

        // Verify that Owner is ALWAYS restricted to ACTIVE templates
        verify(templateService).getList(eq(TemplateType.REVENUE_LEDGER), eq(TemplateStatus.ACTIVE), eq("search"), any(Pageable.class));
    }

    @Test
    @DisplayName("Should retrieve template details with version history for Owner")
    void getTemplate_returnsDetailWithVersionHistory() {
        TemplateResponse detail = TemplateResponse.builder()
                .id(1L)
                .templateCode("RL-001")
                .templateName("Revenue Ledger")
                .status(TemplateStatus.ACTIVE)
                .currentVersionNumber(2)
                .build();

        when(templateService.getDetail(1L)).thenReturn(detail);

        ResponseEntity<ApiResponse<TemplateResponse>> response = controller.getTemplate(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getId()).isEqualTo(1L);
        assertThat(response.getBody().getData().getCurrentVersionNumber()).isEqualTo(2);

        verify(templateService).getDetail(1L);
    }
}
