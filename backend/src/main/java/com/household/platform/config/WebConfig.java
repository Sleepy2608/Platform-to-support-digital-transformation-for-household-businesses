package com.household.platform.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Shared WebMvc customization (message converters, interceptors) sẽ bổ sung khi cần.
}
