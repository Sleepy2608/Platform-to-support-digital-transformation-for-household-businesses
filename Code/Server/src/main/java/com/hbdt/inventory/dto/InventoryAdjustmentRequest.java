package com.hbdt.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAdjustmentRequest {

    @NotNull(message = "Sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Đơn vị tính không được để trống")
    private Long unitId;

    @NotNull(message = "Số lượng kiểm kê/điều chỉnh không được để trống")
    @DecimalMin(value = "0.000", message = "Số lượng không được nhỏ hơn 0")
    @Digits(integer = 15, fraction = 3, message = "Số lượng chỉ được có tối đa 3 chữ số thập phân")
    private BigDecimal quantity;

    /**
     * Loại điều chỉnh:
     * - "SET" (mặc định): Đặt lại tồn kho theo số lượng thực tế kiểm kê được.
     * - "INCREASE": Điều chỉnh tăng thêm số lượng.
     * - "DECREASE": Điều chỉnh giảm bớt số lượng.
     */
    private String adjustmentType;

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    @Size(max = 500, message = "Lý do điều chỉnh không được vượt quá 500 ký tự")
    private String reason;
}
