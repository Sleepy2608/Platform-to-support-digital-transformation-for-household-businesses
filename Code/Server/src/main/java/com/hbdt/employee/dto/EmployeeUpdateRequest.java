package com.hbdt.employee.dto;

import com.hbdt.entity.enums.UserStatus;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * Request cập nhật thông tin nhân viên (do Owner thực hiện).
 * Owner được quyền sửa: họ tên, chức vụ, trạng thái, ngày nghỉ việc.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeUpdateRequest {

    @Size(max = 150, message = "Họ và tên quá dài")
    private String fullName;

    @Size(max = 100, message = "Chức vụ quá dài")
    private String position;

    private UserStatus status;

    private LocalDate terminationDate;
}
