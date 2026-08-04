package com.erdonline.erd.publicapi;

import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.digest.DigestUtil;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * OAuth client_id / client_secret / access_token / refresh_token / authorization_code 明文格式与哈希。
 * 库中只存 {@link #hash(String)}。PKCE 仅允许 S256。
 */
public final class OAuthClientCodec {

    public static final String CLIENT_ID_PREFIX = "erd_cli_";
    public static final String CLIENT_SECRET_PREFIX = "erd_cs_";
    public static final String ACCESS_TOKEN_PREFIX = "erd_oat_";
    public static final String REFRESH_TOKEN_PREFIX = "erd_ort_";
    public static final String AUTH_CODE_PREFIX = "erd_ac_";

    public static final String CLIENT_TYPE_CONFIDENTIAL = "confidential";
    public static final String CLIENT_TYPE_PUBLIC = "public";
    public static final String PKCE_S256 = "S256";

    private static final int ID_BYTES = 12;
    private static final int SECRET_BYTES = 24;
    private static final int CODE_BYTES = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** RFC 7636 code_verifier：43–128 字符 unreserved */
    private static final Pattern CODE_VERIFIER = Pattern.compile("^[A-Za-z0-9\\-._~]{43,128}$");
    /** BASE64URL(SHA256(...)) 长度 43 */
    private static final Pattern CODE_CHALLENGE = Pattern.compile("^[A-Za-z0-9\\-_]{43}$");

    private OAuthClientCodec() {
    }

    public static String generateClientId() {
        return CLIENT_ID_PREFIX + randomHex(ID_BYTES);
    }

    public static String generateClientSecret() {
        return CLIENT_SECRET_PREFIX + randomHex(SECRET_BYTES);
    }

    public static String generateAccessToken() {
        return ACCESS_TOKEN_PREFIX + randomHex(SECRET_BYTES);
    }

    public static String generateRefreshToken() {
        return REFRESH_TOKEN_PREFIX + randomHex(SECRET_BYTES);
    }

    public static String generateAuthorizationCode() {
        return AUTH_CODE_PREFIX + randomHex(CODE_BYTES);
    }

    public static boolean looksLikeAccessToken(String raw) {
        return raw != null && raw.startsWith(ACCESS_TOKEN_PREFIX) && raw.length() > ACCESS_TOKEN_PREFIX.length() + 8;
    }

    public static boolean looksLikeRefreshToken(String raw) {
        return raw != null && raw.startsWith(REFRESH_TOKEN_PREFIX) && raw.length() > REFRESH_TOKEN_PREFIX.length() + 8;
    }

    public static boolean looksLikeClientId(String raw) {
        return raw != null && raw.startsWith(CLIENT_ID_PREFIX) && raw.length() > CLIENT_ID_PREFIX.length() + 4;
    }

    public static boolean looksLikeAuthorizationCode(String raw) {
        return raw != null && raw.startsWith(AUTH_CODE_PREFIX) && raw.length() > AUTH_CODE_PREFIX.length() + 8;
    }

    public static String hash(String plaintext) {
        return DigestUtil.sha256Hex(plaintext);
    }

    /** 常量时间比较两个 SHA-256 hex（防时序侧信道） */
    public static boolean hashEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] left = a.getBytes(StandardCharsets.US_ASCII);
        byte[] right = b.getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(left, right);
    }

    /** 列表可见提示：省略号 + 末 4 字符 */
    public static String hint(String plaintext) {
        if (plaintext == null || plaintext.length() < 4) {
            return "****";
        }
        return "…" + plaintext.substring(plaintext.length() - 4);
    }

    public static boolean isValidCodeVerifier(String verifier) {
        return verifier != null && CODE_VERIFIER.matcher(verifier).matches();
    }

    public static boolean isValidCodeChallenge(String challenge) {
        return challenge != null && CODE_CHALLENGE.matcher(challenge).matches();
    }

    /**
     * RFC 7636 S256：BASE64URL-ENCODE(SHA256(ASCII(code_verifier))) without padding.
     */
    public static String s256Challenge(String codeVerifier) {
        byte[] digest = DigestUtil.sha256(codeVerifier.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }

    public static boolean verifyPkceS256(String codeVerifier, String codeChallenge) {
        if (!isValidCodeVerifier(codeVerifier) || !isValidCodeChallenge(codeChallenge)) {
            return false;
        }
        String computed = s256Challenge(codeVerifier);
        return hashEquals(computed, codeChallenge);
    }

    public static String normalizeClientType(String raw) {
        if (raw == null || raw.isBlank()) {
            return CLIENT_TYPE_CONFIDENTIAL;
        }
        String t = raw.trim().toLowerCase(Locale.ROOT);
        if (CLIENT_TYPE_PUBLIC.equals(t) || CLIENT_TYPE_CONFIDENTIAL.equals(t)) {
            return t;
        }
        throw new IllegalArgumentException("clientType must be confidential or public");
    }

    /** 换行分隔 redirect_uri；剔除空白；拒绝重复。 */
    public static String joinRedirectUris(List<String> uris) {
        if (uris == null || uris.isEmpty()) {
            return null;
        }
        List<String> cleaned = new ArrayList<>();
        for (String u : uris) {
            if (u == null || u.isBlank()) {
                continue;
            }
            String exact = u.trim();
            validateRedirectUriShape(exact);
            if (!cleaned.contains(exact)) {
                cleaned.add(exact);
            }
        }
        if (cleaned.isEmpty()) {
            return null;
        }
        return String.join("\n", cleaned);
    }

    public static List<String> parseRedirectUris(String stored) {
        List<String> out = new ArrayList<>();
        if (stored == null || stored.isBlank()) {
            return out;
        }
        for (String line : stored.split("\\R")) {
            if (!line.isBlank()) {
                out.add(line.trim());
            }
        }
        return out;
    }

    public static boolean redirectUriAllowed(String stored, String redirectUri) {
        if (redirectUri == null || redirectUri.isBlank()) {
            return false;
        }
        String exact = redirectUri.trim();
        for (String allowed : parseRedirectUris(stored)) {
            if (exact.equals(allowed)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 硬性形状：https 或 http://localhost / 127.0.0.1 / [::1]；禁 fragment。
     */
    public static void validateRedirectUriShape(String uri) {
        if (uri == null || uri.isBlank()) {
            throw new IllegalArgumentException("redirect_uri required");
        }
        if (uri.indexOf('#') >= 0) {
            throw new IllegalArgumentException("redirect_uri must not contain fragment");
        }
        String lower = uri.toLowerCase(Locale.ROOT);
        boolean https = lower.startsWith("https://");
        boolean localHttp = lower.startsWith("http://localhost")
                || lower.startsWith("http://127.0.0.1")
                || lower.startsWith("http://[::1]");
        if (!https && !localHttp) {
            throw new IllegalArgumentException(
                    "redirect_uri must be https or http://localhost|127.0.0.1|[::1]");
        }
        if (uri.length() > 512) {
            throw new IllegalArgumentException("redirect_uri too long");
        }
    }

    /** 同意页展示：host 或 host:port（显式端口时保留）。 */
    public static String redirectHost(String redirectUri) {
        if (redirectUri == null || redirectUri.isBlank()) {
            return "";
        }
        try {
            URI u = URI.create(redirectUri.trim());
            String host = u.getHost();
            if (host == null || host.isBlank()) {
                return "";
            }
            int port = u.getPort();
            if (port > 0) {
                return host + ":" + port;
            }
            return host;
        } catch (IllegalArgumentException ex) {
            return "";
        }
    }

    private static String randomHex(int bytes) {
        byte[] buf = new byte[bytes];
        RANDOM.nextBytes(buf);
        return HexUtil.encodeHexStr(buf);
    }
}
