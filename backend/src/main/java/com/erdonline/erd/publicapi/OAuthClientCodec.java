package com.erdonline.erd.publicapi;

import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.digest.DigestUtil;

import java.security.SecureRandom;

/**
 * OAuth client_id / client_secret / access_token 明文格式与哈希。库中只存 {@link #hash(String)}。
 */
public final class OAuthClientCodec {

    public static final String CLIENT_ID_PREFIX = "erd_cli_";
    public static final String CLIENT_SECRET_PREFIX = "erd_cs_";
    public static final String ACCESS_TOKEN_PREFIX = "erd_oat_";

    private static final int ID_BYTES = 12;
    private static final int SECRET_BYTES = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

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

    public static boolean looksLikeAccessToken(String raw) {
        return raw != null && raw.startsWith(ACCESS_TOKEN_PREFIX) && raw.length() > ACCESS_TOKEN_PREFIX.length() + 8;
    }

    public static boolean looksLikeClientId(String raw) {
        return raw != null && raw.startsWith(CLIENT_ID_PREFIX) && raw.length() > CLIENT_ID_PREFIX.length() + 4;
    }

    public static String hash(String plaintext) {
        return DigestUtil.sha256Hex(plaintext);
    }

    /** 列表可见提示：省略号 + 末 4 字符 */
    public static String hint(String plaintext) {
        if (plaintext == null || plaintext.length() < 4) {
            return "****";
        }
        return "…" + plaintext.substring(plaintext.length() - 4);
    }

    private static String randomHex(int bytes) {
        byte[] buf = new byte[bytes];
        RANDOM.nextBytes(buf);
        return HexUtil.encodeHexStr(buf);
    }
}
