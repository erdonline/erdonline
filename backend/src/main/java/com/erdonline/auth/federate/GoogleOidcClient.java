package com.erdonline.auth.federate;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Google Authorization Code + OIDC userinfo。
 */
@Component
@RequiredArgsConstructor
public class GoogleOidcClient {

    private static final String AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN = "https://oauth2.googleapis.com/token";
    private static final String USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

    private final FederateProperties properties;
    private final FederateHttpClient http;

    public String buildAuthorizeUrl(String state) {
        FederateProperties.Google g = properties.getGoogle();
        return AUTH
                + "?client_id=" + FederateHttpClient.encode(g.getClientId().trim())
                + "&redirect_uri=" + FederateHttpClient.encode(g.getRedirectUri().trim())
                + "&response_type=code"
                + "&scope=" + FederateHttpClient.encode("openid email profile")
                + "&state=" + FederateHttpClient.encode(state)
                + "&access_type=online"
                + "&prompt=select_account";
    }

    public FederateIdentity exchange(String code) throws IOException, InterruptedException {
        FederateProperties.Google g = properties.getGoogle();
        Map<String, String> form = new LinkedHashMap<>();
        form.put("code", code);
        form.put("client_id", g.getClientId().trim());
        form.put("client_secret", g.getClientSecret().trim());
        form.put("redirect_uri", g.getRedirectUri().trim());
        form.put("grant_type", "authorization_code");
        JsonNode token = http.postForm(TOKEN, form);
        String access = text(token, "access_token");
        if (!StringUtils.hasText(access)) {
            throw new IOException("Google token response missing access_token");
        }
        JsonNode info = http.getJsonBearer(USERINFO, access);
        String sub = text(info, "sub");
        if (!StringUtils.hasText(sub)) {
            throw new IOException("Google userinfo missing sub");
        }
        String email = text(info, "email");
        boolean verified = info.path("email_verified").asBoolean(false)
                || "true".equalsIgnoreCase(text(info, "email_verified"));
        if (StringUtils.hasText(email) && !verified) {
            throw new IOException("Google email not verified");
        }
        String name = firstNonBlank(text(info, "name"), text(info, "given_name"), email);
        return new FederateIdentity(FederateProvider.GOOGLE, sub, null, email, verified, name);
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText();
        return StringUtils.hasText(s) ? s.trim() : null;
    }

    private static String firstNonBlank(String... vals) {
        if (vals == null) {
            return null;
        }
        for (String v : vals) {
            if (StringUtils.hasText(v)) {
                return v.trim();
            }
        }
        return null;
    }
}
