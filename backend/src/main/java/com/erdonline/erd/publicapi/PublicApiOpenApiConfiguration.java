package com.erdonline.erd.publicapi;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 公开 API OpenAPI 分组。仅当 springdoc 开启时生效（prod 默认关）。
 */
@Configuration
@ConditionalOnProperty(name = "springdoc.api-docs.enabled", havingValue = "true", matchIfMissing = true)
public class PublicApiOpenApiConfiguration {

    @Bean
    GroupedOpenApi publicApiV1Group() {
        return GroupedOpenApi.builder()
                .group("public-v1")
                .pathsToMatch("/api/v1/**")
                .addOpenApiCustomizer(publicApiSecurityCustomizer())
                .build();
    }

    private static OpenApiCustomizer publicApiSecurityCustomizer() {
        return openApi -> {
            openApi.info(new Info()
                    .title("ERD Online Public API")
                    .description("Bearer Personal Access Token (erd_pat_…). See ADR-0013.")
                    .version("v1"));
            if (openApi.getComponents() == null) {
                openApi.setComponents(new io.swagger.v3.oas.models.Components());
            }
            openApi.getComponents().addSecuritySchemes("bearer-pat",
                    new SecurityScheme()
                            .type(SecurityScheme.Type.HTTP)
                            .scheme("bearer")
                            .bearerFormat("PAT")
                            .description("Mint at POST /auth/personal-access-tokens (session JWT)"));
        };
    }
}
