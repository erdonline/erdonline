package com.erdonline.auth.federate;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GitHub OAuth App（Authorization Code）；subject=数字 {@code id}；邮箱取已验证 primary。
 */
@Component
@RequiredArgsConstructor
public class GitHubOauthClient {

    private static final String AUTH = "https://github.com/login/oauth/authorize";
    private static final String TOKEN = "https://github.com/login/oauth/access_token";
    private static final String USER = "https://api.github.com/user";
    private static final String EMAILS = "https://api.github.com/user/emails";

    private final FederateProperties properties;
    private final FederateHttpClient http;

    public String buildAuthorizeUrl(String state) {
        FederateProperties.Github g = properties.getGithub();
        return AUTH
                + "?client_id=" + FederateHttpClient.encode(g.getClientId().trim())
                + "&redirect_uri=" + FederateHttpClient.encode(g.getRedirectUri().trim())
                + "&scope=" + FederateHttpClient.encode("read:user user:email")
                + "&state=" + FederateHttpClient.encode(state);
    }

    public FederateIdentity exchange(String code) throws IOException, InterruptedException {
        FederateProperties.Github g = properties.getGithub();
        Map<String, String> form = new LinkedHashMap<>();
        form.put("client_id", g.getClientId().trim());
        form.put("client_secret", g.getClientSecret().trim());
        form.put("code", code);
        form.put("redirect_uri", g.getRedirectUri().trim());
        JsonNode token = http.postForm(TOKEN, form);
        String access = text(token, "access_token");
        if (!StringUtils.hasText(access)) {
            String err = text(token, "error_description");
            if (!StringUtils.hasText(err)) {
                err = text(token, "error");
            }
            throw new IOException("GitHub token missing access_token"
                    + (StringUtils.hasText(err) ? ": " + err : ""));
        }
        JsonNode user = http.getJsonBearer(USER, access);
        String subject = subjectFromUser(user);
        if (!StringUtils.hasText(subject)) {
            throw new IOException("GitHub user missing id");
        }
        String login = text(user, "login");
        String name = firstNonBlank(text(user, "name"), login);
        EmailPick email = resolveEmail(user, access);
        return new FederateIdentity(
                FederateProvider.GITHUB, subject, null, email.address, email.verified, name);
    }

    private EmailPick resolveEmail(JsonNode user, String access) throws IOException, InterruptedException {
        String publicEmail = text(user, "email");
        // /user.email 仅在公开时有值；仍以 emails API 判定 verified
        JsonNode emails;
        try {
            emails = http.getJsonBearer(EMAILS, access);
        } catch (IOException e) {
            if (StringUtils.hasText(publicEmail)) {
                return new EmailPick(publicEmail, false);
            }
            throw e;
        }
        if (emails == null || !emails.isArray()) {
            return StringUtils.hasText(publicEmail)
                    ? new EmailPick(publicEmail, false)
                    : new EmailPick(null, false);
        }
        String primaryVerified = null;
        String anyVerified = null;
        for (JsonNode row : emails) {
            String addr = text(row, "email");
            if (!StringUtils.hasText(addr)) {
                continue;
            }
            boolean verified = row.path("verified").asBoolean(false);
            boolean primary = row.path("primary").asBoolean(false);
            if (verified && primary) {
                primaryVerified = addr;
            }
            if (verified && anyVerified == null) {
                anyVerified = addr;
            }
        }
        if (primaryVerified != null) {
            return new EmailPick(primaryVerified, true);
        }
        if (anyVerified != null) {
            return new EmailPick(anyVerified, true);
        }
        return StringUtils.hasText(publicEmail)
                ? new EmailPick(publicEmail, false)
                : new EmailPick(null, false);
    }

    private static String subjectFromUser(JsonNode user) {
        JsonNode id = user.get("id");
        if (id == null || id.isNull()) {
            return null;
        }
        if (id.isNumber()) {
            return Long.toString(id.asLong());
        }
        String s = id.asText();
        return StringUtils.hasText(s) ? s.trim() : null;
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

    private record EmailPick(String address, boolean verified) {
    }
}
