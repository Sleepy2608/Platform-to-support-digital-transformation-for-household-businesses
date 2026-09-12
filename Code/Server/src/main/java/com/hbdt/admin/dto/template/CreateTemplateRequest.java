package com.hbdt.admin.dto.template;

import com.fasterxml.jackson.databind.JsonNode;
import com.hbdt.entity.enums.TemplateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request payload for creating a new financial report template.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTemplateRequest {

    @NotBlank(message = "Tên mẫu báo cáo không được để trống")
    @Size(max = 255, message = "Tên mẫu báo cáo tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Mã mẫu không được để trống")
    @Size(max = 50, message = "Mã mẫu tối đa 50 ký tự")
    private String templateCode;

    @NotNull(message = "Loại mẫu báo cáo không được để trống")
    private TemplateType type;

    @Size(max = 50, message = "Mã biểu mẫu tối đa 50 ký tự")
    private String officialFormCode;

    @Size(max = 255, message = "Căn cứ pháp lý tối đa 255 ký tự")
    private String legalBasis;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    @NotNull(message = "Cấu hình JSON không được để trống")
    private JsonNode configurationJson;
}
