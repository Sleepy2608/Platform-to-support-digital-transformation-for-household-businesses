package com.hbdt.admin.dto.template;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request payload for updating a template.
 * If the configurationJson or name differs from the current version,
 * the service layer will create a new immutable version.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTemplateRequest {

    @NotBlank(message = "Tên mẫu báo cáo không được để trống")
    @Size(max = 255, message = "Tên mẫu báo cáo tối đa 255 ký tự")
    private String name;

    @Size(max = 50, message = "Mã biểu mẫu tối đa 50 ký tự")
    private String officialFormCode;

    @Size(max = 255, message = "Căn cứ pháp lý tối đa 255 ký tự")
    private String legalBasis;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    @NotNull(message = "Cấu hình JSON không được để trống")
    private JsonNode configurationJson;
}
