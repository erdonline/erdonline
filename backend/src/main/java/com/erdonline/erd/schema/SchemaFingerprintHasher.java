package com.erdonline.erd.schema;

import cn.hutool.crypto.digest.DigestUtil;
import com.erdonline.erd.util.JsonUtil;

/**
 * Stable SHA-256 over canonical sorted schema IR JSON.
 */
public final class SchemaFingerprintHasher {

    private SchemaFingerprintHasher() {
    }

    public static String hash(SchemaFingerprint fingerprint) {
        if (fingerprint == null) {
            return DigestUtil.sha256Hex("{}");
        }
        SchemaFingerprintBuilder.sortFingerprint(fingerprint);
        return DigestUtil.sha256Hex(JsonUtil.generate(fingerprint));
    }
}
