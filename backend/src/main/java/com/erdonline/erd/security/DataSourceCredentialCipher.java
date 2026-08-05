package com.erdonline.erd.security;

import com.erdonline.erd.entity.DataSources;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * {@code data_sources.username}/{@code password} 落库前后的 AES-256-GCM 加解密（R-DATA-06）。
 *
 * <p>密文格式 {@code enc:v1:<base64(iv||ciphertext||tag)>}；{@link #decrypt(String)} 对无该前缀的
 * 存量明文直接透传（向后兼容），下次经本类 {@link #encrypt(String)} 保存时自动补加密——渐进式迁移，
 * 无需一次性批量改写历史行。</p>
 *
 * <p>密钥来自 {@code ERD_DB_CONFIG_SECRET}（见 {@code erd.datasource-secret.key}）；
 * 本地/dev 允许仓库弱默认（DX），prod 必须显式设置且不得等于该默认串（fail-fast，同 {@code JwtConfig} 套路）。</p>
 */
@Component
public class DataSourceCredentialCipher {

    /** 仅本地/dev DX 默认（application.yml 同串）。prod 必须由 ERD_DB_CONFIG_SECRET 覆盖，且不得等于本值。 */
    public static final String INSECURE_DEV_DEFAULT =
            "erd-online-dev-datasource-secret-change-me-32bytes!!";

    private static final String CIPHER_TRANSFORM = "AES/GCM/NoPadding";
    private static final String PREFIX = "enc:v1:";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecretKeySpec key;

    public DataSourceCredentialCipher(
            @Value("${erd.datasource-secret.key:" + INSECURE_DEV_DEFAULT + "}") String secretKey,
            Environment env) {
        assertSecretSafeForProfile(secretKey, env);
        this.key = deriveKey(secretKey);
    }

    /**
     * prod：拒绝 blank / 仓库开发默认串（即使显式设了 {@code ERD_DB_CONFIG_SECRET} 却手误设成默认值）。
     * 非 prod：允许 application.yml 弱默认，保障本地 {@code dev-ensure}。
     */
    static void assertSecretSafeForProfile(String secret, Environment env) {
        boolean prod = env != null && Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (!prod) {
            return;
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "erd.datasource-secret.key is blank: set ERD_DB_CONFIG_SECRET (>=32 random bytes) for prod");
        }
        if (INSECURE_DEV_DEFAULT.equals(secret.trim())) {
            throw new IllegalStateException(
                    "ERD_DB_CONFIG_SECRET must not use the repository/dev default in prod; rotate to a random secret");
        }
    }

    private static SecretKeySpec deriveKey(String secret) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(hash, "AES");
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to derive data source credential key", e);
        }
    }

    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    /** 明文→密文；已加密或空值原样返回（幂等，避免重复加密）。 */
    public String encrypt(String plaintext) {
        if (!StringUtils.hasText(plaintext) || isEncrypted(plaintext)) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return PREFIX + Base64.getEncoder().encodeToString(combined);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to encrypt data source credential", e);
        }
    }

    /** 密文→明文；无 {@code enc:v1:} 前缀的存量明文原样透传（向后兼容，下次保存自动补加密）。 */
    public String decrypt(String stored) {
        if (!isEncrypted(stored)) {
            return stored;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            byte[] iv = Arrays.copyOfRange(combined, 0, IV_LENGTH_BYTES);
            byte[] ciphertext = Arrays.copyOfRange(combined, IV_LENGTH_BYTES, combined.length);
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException(
                    "Failed to decrypt data source credential (ERD_DB_CONFIG_SECRET rotated or data corrupted?)", e);
        }
    }

    /** 落库前调用：username/password 明文→密文（原地修改）。 */
    public void encryptInPlace(DataSources ds) {
        if (ds == null) {
            return;
        }
        ds.setUsername(encrypt(ds.getUsername()));
        ds.setPassword(encrypt(ds.getPassword()));
    }

    /** 取出后调用：username/password 密文→明文（原地修改）。 */
    public void decryptInPlace(DataSources ds) {
        if (ds == null) {
            return;
        }
        ds.setUsername(decrypt(ds.getUsername()));
        ds.setPassword(decrypt(ds.getPassword()));
    }
}
