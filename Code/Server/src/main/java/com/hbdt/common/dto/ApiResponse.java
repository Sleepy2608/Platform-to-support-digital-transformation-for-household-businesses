package com.hbdt.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.message = "Thành công";
        res.data = data;
        return res;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.message = message;
        res.data = data;
        return res;
    }

    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = false;
        res.message = message;
        return res;
    }

    public static <T> ApiResponse<T> error(String message, T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = false;
        res.message = message;
        res.data = data;
        return res;
    }
}
