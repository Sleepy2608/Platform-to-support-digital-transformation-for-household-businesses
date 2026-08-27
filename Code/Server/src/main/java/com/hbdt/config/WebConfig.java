package com.hbdt.config;

import com.hbdt.common.service.ImageStorageService;
import com.hbdt.subscription.interceptor.SubscriptionInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration:
 * - Enables @Async (used by MailService)
 * - Enables @Scheduled (used by OtpService cleanup)
 * - Maps /uploads/** to the local upload directory so avatars are accessible via HTTP
 * - Registers SubscriptionInterceptor for business API endpoints
 */
@Configuration
@EnableAsync
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

    private final ImageStorageService imageStorageService;
    private final SubscriptionInterceptor subscriptionInterceptor;

    public WebConfig(ImageStorageService imageStorageService, SubscriptionInterceptor subscriptionInterceptor) {
        this.imageStorageService = imageStorageService;
        this.subscriptionInterceptor = subscriptionInterceptor;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(imageStorageService.resourceLocation());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(subscriptionInterceptor)
                .addPathPatterns(
                        "/api/products/**",
                        "/api/categories/**",
                        "/api/product-units/**",
                        "/api/orders/**",
                        "/api/inventory/**",
                        "/api/customers/**",
                        "/api/prices/**",
                        "/api/price-resolution/**",
                        "/api/owner/employees/**"
                );
    }
}
