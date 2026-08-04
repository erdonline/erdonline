package com.erdonline.erd.publicapi;

import cn.hutool.core.util.HexUtil;
import cn.hutool.crypto.digest.DigestUtil;

import java.security.SecureRandom;

/**
 * PAT 明文格式与哈希。库中只存 {@link #hash(String)}。
 */
public final class PatTokenCodec {

    public static final String PREFIX = "erd_pat_";
    private static final int SECRET_BYTES = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PatTokenCodec() {
    }

    public static String generatePlaintext() {
        byte[] buf = new byte[SECRET_BYTES];
        RANDOM.nextBytes(buf);
        return PREFIX + HexUtil.encodeHexStr(buf);
    }

    public static boolean looksLikePat(String raw) {
        return raw != null && raw.startsWith(PREFIX) && raw.length() > PREFIX.length() + 8;
    }

    public static String hash(String plaintext) {
        return DigestUtil.sha256Hex(plaintext);
    }

    /** 列表可见提示：省略号 + 末 4 字符（不含前缀，控制列宽） */
    public static String hint(String plaintext) {
        if (plaintext == null || plaintext.length() < 4) {
            return "****";
        }
        return "…" + plaintext.substring(plaintext.length() - 4);
    }
}
