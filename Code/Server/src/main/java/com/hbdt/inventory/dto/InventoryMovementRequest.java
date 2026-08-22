package com.hbdt.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementRequest {

    @NotNull(message = "Sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Đơn vị tính không được để trống")
    private Long unitId;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn 0")
    @Digits(integer = 15, fraction = 3, message = "Số lượng chỉ được có tối đa 3 chữ số thập phân")
    private BigDecimal quantity;

    @DecimalMin(value = "0.00", message = "Đơn giá không được nhỏ hơn 0")
    @Digits(integer = 16, fraction = 2, message = "Đơn giá chỉ được có tối đa 2 chữ số thập phân")
    private BigDecimal unitCost;

    private Long referenceId;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;
}
