package com.hbdt.imports.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for single product row in import file
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImportRequest {

    /** Dòng thực tế trong tệp nguồn, dùng để trả lỗi chính xác cho người dùng. */
    private int sourceRowNumber;

    /** Giá trị gốc trước khi chuyển kiểu, dùng để phân biệt ô trống với dữ liệu sai định dạng. */
    private String salePriceRaw;
    private String quantityOnHandRaw;

    @NotBlank(message = "Mã sản phẩm không được để trống")
    @Size(max = 50, message = "Mã sản phẩm không được vượt quá 50 ký tự")
    private String productCode;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    private String productName;

    @Size(max = 30, message = "Mã danh mục không được vượt quá 30 ký tự")
    private String categoryCode;

    @NotBlank(message = "Mã đơn vị tính không được để trống")
    @Size(max = 30, message = "Mã đơn vị tính không được vượt quá 30 ký tự")
    private String baseUnitCode;

    @DecimalMin(value = "0.0", inclusive = true, message = "Giá bán không được âm")
    @Digits(integer = 16, fraction = 2, message = "Giá bán không hợp lệ")
    private BigDecimal salePrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Tồn kho ban đầu không được âm")
    @Digits(integer = 15, fraction = 3, message = "Tồn kho ban đầu không hợp lệ")
    private BigDecimal quantityOnHand;

    @Pattern(regexp = "(?i)ACTIVE|INACTIVE|", message = "Trạng thái phải là ACTIVE hoặc INACTIVE")
    private String status;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;
}
