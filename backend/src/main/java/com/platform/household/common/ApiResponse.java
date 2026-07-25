package com.platform.household.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private int status;       // HTTP Status Code (200, 400, 404, 500)
    private String message;   // Thông báo cho user (VD: "Tạo đơn hàng thành công")
    private T data;           // Payload dữ liệu trả về

    // Hàm tiện ích trả về thành công
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    // Hàm tiện ích trả về lỗi
    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
                .status(status)
                .message(message)
                .data(null)
                .build();
    }
}