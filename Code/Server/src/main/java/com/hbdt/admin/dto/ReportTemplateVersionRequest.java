package com.hbdt.admin.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReportTemplateVersionRequest(@NotBlank String versionNumber,
        @NotNull JsonNode templateSchema, @NotNull LocalDate effectiveFrom, LocalDate effectiveTo) { }
