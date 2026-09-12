package com.hbdt.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hbdt.admin.dto.template.*;
import com.hbdt.common.exception.BadRequestException;
import com.hbdt.common.exception.ResourceNotFoundException;
import com.hbdt.entity.ReportTemplate;
import com.hbdt.entity.ReportTemplateVersion;
import com.hbdt.entity.enums.TemplateStatus;
import com.hbdt.entity.enums.TemplateType;
import com.hbdt.repository.ReportTemplateRepository;
import com.hbdt.repository.ReportTemplateVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Comprehensive unit tests for {@link FinancialTemplateService} and
 * {@link TemplateIntegrationService}.
 *
 * <p>Covers all 10 scenarios specified in the testing requirements.</p>
 */
@ExtendWith(MockitoExtension.class)
class FinancialTemplateServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private ReportTemplateRepository templateRepository;
    @Mock private ReportTemplateVersionRepository versionRepository;

    private FinancialTemplateService templateService;
    private TemplateIntegrationService integrationService;

    private static final Long ADMIN_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        templateService = new FinancialTemplateService(templateRepository, versionRepository);
        integrationService = new TemplateIntegrationService(templateRepository, versionRepository);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Helper: builds a sample JSON configuration
    // ═══════════════════════════════════════════════════════════════════

    private JsonNode sampleConfig(String... fieldKeys) {
        ObjectNode config = objectMapper.createObjectNode();
        config.put("title", "Sample Template");
        ArrayNode fields = objectMapper.createArrayNode();
        for (String key : fieldKeys) {
            ObjectNode field = objectMapper.createObjectNode();
            field.put("key", key);
            field.put("label", key.replace("_", " "));
            field.put("type", "currency");
            fields.add(field);
        }
        config.set("fields", fields);
        return config;
    }

    private ReportTemplate buildTemplate(Long id, String code, TemplateType type,
                                          TemplateStatus status, Long currentVersionId) {
        return ReportTemplate.builder()
                .id(id)
                .templateCode(code)
                .templateName("Test Template " + code)
                .templateType(type)
                .status(status)
                .currentVersionId(currentVersionId)
                .createdBy(ADMIN_USER_ID)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private ReportTemplateVersion buildVersion(Long id, Long templateId,
                                                int versionNumber, JsonNode schema) {
        return ReportTemplateVersion.builder()
                .id(id)
                .reportTemplateId(templateId)
                .versionNumber(versionNumber)
                .templateSchema(schema)
                .effectiveFrom(LocalDate.now())
                .status("ACTIVE")
                .createdBy(ADMIN_USER_ID)
                .updatedBy(ADMIN_USER_ID)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 1: Test creating a new Financial Template
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 1: Create Template")
    class CreateTemplateTests {

        @Test
        @DisplayName("Should persist template as ACTIVE with initial version v1")
        void createTemplate_persistsTemplateAndInitialVersion() {
            // Arrange
            JsonNode config = sampleConfig("totalRevenue", "totalExpense");
            CreateTemplateRequest request = CreateTemplateRequest.builder()
                    .name("Revenue Ledger Q4")
                    .templateCode("RL-Q4-2026")
                    .type(TemplateType.REVENUE_LEDGER)
                    .configurationJson(config)
                    .build();

            when(templateRepository.existsByTemplateCode("RL-Q4-2026")).thenReturn(false);
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> {
                ReportTemplate t = inv.getArgument(0);
                t.setId(10L);
                t.setCreatedAt(LocalDateTime.now());
                t.setUpdatedAt(LocalDateTime.now());
                return t;
            });
            when(versionRepository.save(any(ReportTemplateVersion.class))).thenAnswer(inv -> {
                ReportTemplateVersion v = inv.getArgument(0);
                v.setId(100L);
                v.setCreatedAt(LocalDateTime.now());
                v.setUpdatedAt(LocalDateTime.now());
                return v;
            });

            // Act
            TemplateResponse response = templateService.create(request, ADMIN_USER_ID);

            // Assert — template
            assertThat(response.getTemplateCode()).isEqualTo("RL-Q4-2026");
            assertThat(response.getTemplateName()).isEqualTo("Revenue Ledger Q4");
            assertThat(response.getTemplateType()).isEqualTo(TemplateType.REVENUE_LEDGER);
            assertThat(response.getStatus()).isEqualTo(TemplateStatus.ACTIVE);

            // Assert — version
            assertThat(response.getCurrentVersionNumber()).isEqualTo(1);
            assertThat(response.getCurrentConfigurationJson()).isEqualTo(config);

            // Verify persistence calls
            verify(templateRepository, times(2)).save(any(ReportTemplate.class));
            verify(versionRepository).save(any(ReportTemplateVersion.class));
        }

        @Test
        @DisplayName("Should reject duplicate template code")
        void createTemplate_rejectsDuplicateCode() {
            CreateTemplateRequest request = CreateTemplateRequest.builder()
                    .name("Duplicate")
                    .templateCode("DUP-001")
                    .type(TemplateType.EXPENSE_LEDGER)
                    .configurationJson(sampleConfig())
                    .build();

            when(templateRepository.existsByTemplateCode("DUP-001")).thenReturn(true);

            assertThatThrownBy(() -> templateService.create(request, ADMIN_USER_ID))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("DUP-001");

            verify(templateRepository, never()).save(any());
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 2: Test viewing the template list
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 2: List Templates")
    class ListTemplateTests {

        @Test
        @DisplayName("Should return paginated results with version number")
        @SuppressWarnings("unchecked")
        void listTemplates_returnsPaginatedResults() {
            ReportTemplate t1 = buildTemplate(1L, "RL-001", TemplateType.REVENUE_LEDGER,
                    TemplateStatus.ACTIVE, 100L);
            ReportTemplate t2 = buildTemplate(2L, "EL-001", TemplateType.EXPENSE_LEDGER,
                    TemplateStatus.INACTIVE, 200L);

            Pageable pageable = PageRequest.of(0, 10);
            Page<ReportTemplate> page = new PageImpl<>(List.of(t1, t2), pageable, 2);

            when(templateRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
            when(versionRepository.findById(100L))
                    .thenReturn(Optional.of(buildVersion(100L, 1L, 3, sampleConfig())));
            when(versionRepository.findById(200L))
                    .thenReturn(Optional.of(buildVersion(200L, 2L, 1, sampleConfig())));

            Page<TemplateListResponse> result = templateService.getList(null, null, null, pageable);

            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getContent().get(0).getCurrentVersionNumber()).isEqualTo(3);
            assertThat(result.getContent().get(1).getCurrentVersionNumber()).isEqualTo(1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 3: Test detail view with version history
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 3: Detail View")
    class DetailViewTests {

        @Test
        @DisplayName("Should return template with full version history")
        void getDetail_returnsTemplateWithVersionHistory() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 102L);

            ReportTemplateVersion v1 = buildVersion(100L, 1L, 1, sampleConfig("rev"));
            v1.setStatus("SUPERSEDED");
            ReportTemplateVersion v2 = buildVersion(101L, 1L, 2, sampleConfig("rev", "exp"));
            v2.setStatus("SUPERSEDED");
            ReportTemplateVersion v3 = buildVersion(102L, 1L, 3, sampleConfig("rev", "exp", "net"));

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(List.of(v3, v2, v1));

            TemplateResponse response = templateService.getDetail(1L);

            assertThat(response.getCurrentVersionNumber()).isEqualTo(3);
            assertThat(response.getVersionHistory()).hasSize(3);
            assertThat(response.getVersionHistory().get(0).getVersionNumber()).isEqualTo(3);
            assertThat(response.getVersionHistory().get(2).getVersionNumber()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existent template")
        void getDetail_throwsForNonExistent() {
            when(templateRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> templateService.getDetail(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 4 & 5: Test updating a template (versioning logic)
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 4 & 5: Update Template (Versioning)")
    class UpdateTemplateTests {

        @Test
        @DisplayName("TC4: Should create new version when configuration changes")
        void updateTemplate_createsNewVersionWhenConfigChanges() {
            JsonNode oldConfig = sampleConfig("totalRevenue");
            JsonNode newConfig = sampleConfig("totalRevenue", "totalExpense");

            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 100L);
            ReportTemplateVersion v1 = buildVersion(100L, 1L, 1, oldConfig);

            UpdateTemplateRequest request = UpdateTemplateRequest.builder()
                    .name(template.getTemplateName())
                    .configurationJson(newConfig)
                    .build();

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(versionRepository.findTopByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(Optional.of(v1));
            when(versionRepository.save(any(ReportTemplateVersion.class))).thenAnswer(inv -> {
                ReportTemplateVersion v = inv.getArgument(0);
                if (v.getId() == null) v.setId(101L);
                v.setCreatedAt(LocalDateTime.now());
                v.setUpdatedAt(LocalDateTime.now());
                return v;
            });
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(List.of(
                            buildVersion(101L, 1L, 2, newConfig),
                            buildVersion(100L, 1L, 1, oldConfig)
                    ));

            TemplateResponse response = templateService.update(1L, request, ADMIN_USER_ID);

            // New version created
            ArgumentCaptor<ReportTemplateVersion> versionCaptor =
                    ArgumentCaptor.forClass(ReportTemplateVersion.class);
            verify(versionRepository, times(2)).save(versionCaptor.capture());

            List<ReportTemplateVersion> savedVersions = versionCaptor.getAllValues();
            // First save: old version marked SUPERSEDED
            assertThat(savedVersions.get(0).getStatus()).isEqualTo("SUPERSEDED");
            assertThat(savedVersions.get(0).getEffectiveTo()).isNotNull();
            // Second save: new version with incremented number
            assertThat(savedVersions.get(1).getVersionNumber()).isEqualTo(2);
            assertThat(savedVersions.get(1).getTemplateSchema()).isEqualTo(newConfig);

            assertThat(response.getVersionHistory()).hasSize(2);
        }

        @Test
        @DisplayName("TC5: Should skip versioning when no config/name change")
        void updateTemplate_skipsVersioningWhenNoChange() {
            JsonNode config = sampleConfig("totalRevenue");

            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 100L);
            ReportTemplateVersion v1 = buildVersion(100L, 1L, 1, config);

            UpdateTemplateRequest request = UpdateTemplateRequest.builder()
                    .name(template.getTemplateName())
                    .description("Updated description only")
                    .configurationJson(config) // same config
                    .build();

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(versionRepository.findTopByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(Optional.of(v1));
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(List.of(v1));

            templateService.update(1L, request, ADMIN_USER_ID);

            // Only the template is saved (metadata update), no new version created
            verify(versionRepository, never()).save(any(ReportTemplateVersion.class));
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 6 & 7: Activate / Deactivate
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 6 & 7: Status Toggle")
    class StatusToggleTests {

        @Test
        @DisplayName("TC6: Should activate an INACTIVE template")
        void activateTemplate_setsStatusActive() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.INACTIVE, 100L);

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(List.of(buildVersion(100L, 1L, 1, sampleConfig())));

            TemplateResponse response = templateService.updateStatus(1L, TemplateStatus.ACTIVE);

            assertThat(response.getStatus()).isEqualTo(TemplateStatus.ACTIVE);
            verify(templateRepository).save(argThat(t -> t.getStatus() == TemplateStatus.ACTIVE));
        }

        @Test
        @DisplayName("TC7: Should deactivate an ACTIVE template")
        void deactivateTemplate_setsStatusInactive() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 100L);

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(templateRepository.save(any(ReportTemplate.class))).thenAnswer(inv -> inv.getArgument(0));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(List.of(buildVersion(100L, 1L, 1, sampleConfig())));

            TemplateResponse response = templateService.updateStatus(1L, TemplateStatus.INACTIVE);

            assertThat(response.getStatus()).isEqualTo(TemplateStatus.INACTIVE);
        }

        @Test
        @DisplayName("Should reject setting same status")
        void updateStatus_rejectsSameStatus() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 100L);

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));

            assertThatThrownBy(() -> templateService.updateStatus(1L, TemplateStatus.ACTIVE))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("ACTIVE");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 8: Version history ordering
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 8: Version History")
    class VersionHistoryTests {

        @Test
        @DisplayName("Should return all versions ordered newest-first")
        void getVersionHistory_returnsAllVersionsOrdered() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 103L);

            List<ReportTemplateVersion> versions = List.of(
                    buildVersion(103L, 1L, 3, sampleConfig("c")),
                    buildVersion(102L, 1L, 2, sampleConfig("b")),
                    buildVersion(101L, 1L, 1, sampleConfig("a"))
            );

            when(templateRepository.findById(1L)).thenReturn(Optional.of(template));
            when(versionRepository.findByReportTemplateIdOrderByVersionNumberDesc(1L))
                    .thenReturn(versions);

            TemplateResponse response = templateService.getDetail(1L);

            assertThat(response.getVersionHistory())
                    .extracting(TemplateVersionResponse::getVersionNumber)
                    .containsExactly(3, 2, 1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 9: Integration — get active template version
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 9: Integration — Active Version Retrieval")
    class IntegrationActiveVersionTests {

        @Test
        @DisplayName("Should return current version for ACTIVE template")
        void getActiveTemplateVersion_returnsCurrentVersion() {
            ReportTemplate template = buildTemplate(1L, "RL-001",
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE, 100L);
            ReportTemplateVersion version = buildVersion(100L, 1L, 2, sampleConfig("rev"));

            when(templateRepository.findByTemplateTypeAndStatus(
                    TemplateType.REVENUE_LEDGER, TemplateStatus.ACTIVE))
                    .thenReturn(Optional.of(template));
            when(versionRepository.findById(100L)).thenReturn(Optional.of(version));

            ReportTemplateVersion result = integrationService
                    .getActiveTemplateVersion(TemplateType.REVENUE_LEDGER);

            assertThat(result.getId()).isEqualTo(100L);
            assertThat(result.getVersionNumber()).isEqualTo(2);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC 10: Integration — INACTIVE template blocks report generation
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("TC 10: INACTIVE Template Blocks Reports")
    class InactiveTemplateTests {

        @Test
        @DisplayName("Should throw when no ACTIVE template exists for given type")
        void getActiveTemplateVersion_throwsForInactiveTemplate() {
            when(templateRepository.findByTemplateTypeAndStatus(
                    TemplateType.DEBT_REPORT, TemplateStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    integrationService.getActiveTemplateVersion(TemplateType.DEBT_REPORT))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("DEBT_REPORT");
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TC Bonus: Data mapping into template configuration
    // ═══════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("Bonus: Accounting Data Mapping")
    class DataMappingTests {

        @Test
        @DisplayName("Should correctly map accounting data into template fields")
        void mapAccountingDataToTemplate_mapsFieldsCorrectly() {
            JsonNode config = sampleConfig("totalRevenue", "totalExpense", "netIncome");
            ReportTemplateVersion version = buildVersion(100L, 1L, 1, config);

            Map<String, BigDecimal> accountingData = Map.of(
                    "totalRevenue", new BigDecimal("15000000"),
                    "totalExpense", new BigDecimal("8000000")
                    // netIncome intentionally missing — should map to null
            );

            JsonNode reportData = integrationService.mapAccountingDataToTemplate(version, accountingData);

            assertThat(reportData.get("templateVersionId").asLong()).isEqualTo(100L);
            assertThat(reportData.get("versionNumber").asInt()).isEqualTo(1);
            assertThat(reportData.get("data").get("totalRevenue").decimalValue())
                    .isEqualByComparingTo("15000000");
            assertThat(reportData.get("data").get("totalExpense").decimalValue())
                    .isEqualByComparingTo("8000000");
            assertThat(reportData.get("data").get("netIncome").isNull()).isTrue();
        }
    }
}
