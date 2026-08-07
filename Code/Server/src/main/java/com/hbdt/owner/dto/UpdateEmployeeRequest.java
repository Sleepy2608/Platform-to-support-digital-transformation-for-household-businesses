package com.hbdt.owner.dto;

import com.hbdt.entity.enums.UserStatus;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * Request DTO để Owner cập nhật thông tin nhân viên (HBDT-14 + HBDT-114).
 * Owner chỉ được sửa: fullName, position, status, terminationDate, joinDate.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeRequest {

    @Size(min = 2, max = 150, message = "Họ tên phải từ 2 đến 150 ký tự")
    private String fullName;

    @Size(max = 100, message = "Chức vụ tối đa 100 ký tự")
    private String position;

    /** Trạng thái: chỉ cho phép ACTIVE hoặc INACTIVE */
    private UserStatus status;

    private LocalDate joinDate;

    private LocalDate terminationDate;
}
