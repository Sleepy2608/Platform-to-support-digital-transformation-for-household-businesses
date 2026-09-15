package com.hbdt.ai.dto;

import java.util.List;

public record AiBookkeepingDraftResponse(
        String summary,
        List<String> observations,
        List<String> warnings
) {}
