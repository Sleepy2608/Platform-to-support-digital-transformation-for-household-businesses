package com.hbdt.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponseRequest {

    @NotBlank(message = "Phản hồi không được để trống")
    @Size(max = 10000, message = "Phản hồi không được vượt quá 10000 ký tự")
    private String response;
}
