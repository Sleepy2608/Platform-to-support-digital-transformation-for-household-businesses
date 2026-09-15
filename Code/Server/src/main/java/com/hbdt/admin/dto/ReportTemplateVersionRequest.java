package com.hbdt.admin.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record ReportTemplateVersionRequest(@NotNull @Positive Integer versionNumber,
        @NotNull JsonNode templateSchema, @NotNull LocalDate effectiveFrom, LocalDate effectiveTo) { }
