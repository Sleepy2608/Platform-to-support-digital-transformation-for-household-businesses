package com.hbdt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.hbdt.common.service.ImageStorageService;
import com.hbdt.entitlement.interceptor.FeatureEntitlementInterceptor;
import com.hbdt.subscription.interceptor.SubscriptionInterceptor;

/**
 * Web MVC configuration:
 * - Enables @Async (used by MailService)
 * - Enables @Scheduled (used by OtpService cleanup, SubscriptionExpiryScheduler)
 * - Maps /uploads/** to the local upload directory so avatars are accessible via HTTP
 * - Registers FeatureEntitlementInterceptor for /api/owner/** and /api/employee/**
 * - Registers SubscriptionInterceptor for business API endpoints
 */
@Configuration
@EnableAsync
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

    private final ImageStorageService imageStorageService;
    private final FeatureEntitlementInterceptor featureEntitlementInterceptor;
    private final SubscriptionInterceptor subscriptionInterceptor;

    public WebConfig(ImageStorageService imageStorageService,
                     FeatureEntitlementInterceptor featureEntitlementInterceptor,
                     SubscriptionInterceptor subscriptionInterceptor) {
        this.imageStorageService = imageStorageService;
        this.featureEntitlementInterceptor = featureEntitlementInterceptor;
        this.subscriptionInterceptor = subscriptionInterceptor;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(imageStorageService.resourceLocation());
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(featureEntitlementInterceptor)
                .addPathPatterns("/api/owner/**", "/api/employee/**", "/api/products/**",
                        "/api/categories/**");
        registry.addInterceptor(subscriptionInterceptor)
                .addPathPatterns(
                        "/api/products/**",
                        "/api/categories/**",
                        "/api/product-units/**",
                        "/api/sales-orders/**",
                        "/api/inventory/**",
                        "/api/customers/**",
                        "/api/payments/**",
                        "/api/product-prices/**",
                        "/api/price-resolution/**",
                        "/api/owner/employees/**"
                );
    }
}
