package com.hbdt.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 / Swagger UI Configuration for HBDT Platform.
 * Supports interactive testing with JWT Bearer Token authorization.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HBDT Platform REST API")
                        .version("1.0.0")
                        .description("Nền tảng hỗ trợ chuyển đổi số toàn diện cho hộ kinh doanh cá thể (HBDT Platform).\n\n"
                                + "Bao gồm các phân hệ: Bán hàng nhanh (POS), Quản lý kho hàng, "
                                + "Sổ sách kế toán Thông tư 88/2021/TT-BTC, Gói dịch vụ SaaS, "
                                + "và Cổng thanh toán SePay Webhook.")
                        .contact(new Contact()
                                .name("HBDT Development Team")
                                .url("https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Bearer Token để xác thực người dùng (VD: 'eyJhbGciOi...')")));
    }

    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("0. Toàn bộ API (All)")
                .pathsToMatch("/api/**")
                .build();
    }

    @Bean
    public GroupedOpenApi authPublicApi() {
        return GroupedOpenApi.builder()
                .group("1. Công khai & Xác thực (Public & Auth)")
                .pathsToMatch("/api/auth/**", "/api/consent/**", "/api/reference/**", "/api/public/**")
                .build();
    }

    @Bean
    public GroupedOpenApi ownerApi() {
        return GroupedOpenApi.builder()
                .group("2. Chủ hộ kinh doanh (Owner)")
                .pathsToMatch("/api/owner/**", "/api/v1/products/**", "/api/payments/**", "/api/debts/**")
                .build();
    }

    @Bean
    public GroupedOpenApi employeeApi() {
        return GroupedOpenApi.builder()
                .group("3. Nhân viên bán hàng (Employee)")
                .pathsToMatch("/api/employee/**")
                .build();
    }

    @Bean
    public GroupedOpenApi managerApi() {
        return GroupedOpenApi.builder()
                .group("4. Quản lý hệ thống (Manager)")
                .pathsToMatch("/api/manager/**", "/api/platform/**")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("5. Quản trị viên tối cao (Admin)")
                .pathsToMatch("/api/admin/**", "/api/seed/**")
                .build();
    }

    @Bean
    public GroupedOpenApi accountingApi() {
        return GroupedOpenApi.builder()
                .group("6. Kế toán & Doanh thu TT88")
                .pathsToMatch("/api/accounting/**", "/api/revenue/**")
                .build();
    }
}
