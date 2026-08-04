package com.erdonline.auth.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-DEAD-01/02/03：删假开关；ignore-urls 不含无控制器的匿名面。
 */
class DeadSecurityConfigContractTest {

    private static final Path APP_YML = Path.of("src/main/resources/application.yml");
    private static final Path PROD_YML = Path.of("src/main/resources/application-prod.yml");
    private static final Path SWAGGER_PROPS = Path.of(
            "src/main/java/com/erdonline/common/swagger/properties/SwaggerProperties.java");

    @Test
    void noDeadMartinSwaggerOrResourceServerKeys() throws IOException {
        String yml = Files.readString(APP_YML);
        assertFalse(matchesKeyBlock(yml, "swagger"),
                "martin.swagger.* must be removed; gate springdoc via springdoc.*.enabled");
        assertFalse(matchesKeyBlock(yml, "resource-server"),
                "martin.resource-server must be removed");
        assertFalse(Files.exists(SWAGGER_PROPS), "dead SwaggerProperties must stay deleted");
    }

    @Test
    void prodGatesSpringdocNotMartinSwagger() throws IOException {
        String prod = Files.readString(PROD_YML);
        assertTrue(prod.contains("springdoc:"), "prod must configure springdoc");
        assertTrue(Pattern.compile("(?ms)springdoc:.*?api-docs:\\s*\\n\\s*enabled:\\s*false")
                .matcher(prod).find(), "prod must disable springdoc api-docs");
        assertTrue(Pattern.compile("(?ms)springdoc:.*?swagger-ui:\\s*\\n\\s*enabled:\\s*false")
                .matcher(prod).find(), "prod must disable springdoc swagger-ui");
        assertFalse(matchesKeyBlock(prod, "swagger"), "prod must not resurrect martin.swagger");
    }

    @Test
    void ignoreUrlsOmitFakeEndpointAndBareRegister() throws IOException {
        List<String> ignore = parseIgnoreUrls(Files.readString(APP_YML));
        assertFalse(ignore.stream().anyMatch(u -> u.startsWith("/endpoint")),
                "ignore must not contain /endpoint/**");
        assertFalse(ignore.contains("/register") || ignore.contains("/user/register"),
                "ignore must not re-open bare /register or /user/register");
        for (String required : List.of(
                "/login", "/auth/login", "/exit", "/actuator/**",
                "/project/group/user/register", "/error",
                "/oauth/token", "/auth/oauth/token",
                "/oauth/revoke", "/auth/oauth/revoke",
                "/v3/api-docs/**", "/swagger-ui/**")) {
            assertTrue(ignore.contains(required), "ignore missing required path: " + required);
        }
    }

    /** True if a top-level martin: child key named {@code key} exists. */
    private static boolean matchesKeyBlock(String yml, String key) {
        // martin:\n  …\n  swagger:\n
        Matcher martin = Pattern.compile("(?ms)^martin:\\n(.*?)(?=^\\w|\\z)").matcher(yml);
        if (!martin.find()) {
            return false;
        }
        return Pattern.compile("(?m)^ {2}" + Pattern.quote(key) + ":\\s*$")
                .matcher(martin.group(1)).find();
    }

    private static List<String> parseIgnoreUrls(String yml) {
        Matcher m = Pattern.compile("(?ms)^ {6}ignore-urls:\\n((?: {8}- .+\\n)+)").matcher(yml);
        assertTrue(m.find(), "security.oauth2.client.ignore-urls block missing");
        return m.group(1).lines()
                .map(String::trim)
                .filter(l -> l.startsWith("- "))
                .map(l -> l.substring(2).trim())
                .collect(Collectors.toList());
    }
}
