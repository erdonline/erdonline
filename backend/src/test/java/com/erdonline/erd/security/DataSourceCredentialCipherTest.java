package com.erdonline.erd.security;

import com.erdonline.erd.entity.DataSources;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-DATA-06：data_sources.username/password 落库加密 roundtrip + 向后兼容。
 */
class DataSourceCredentialCipherTest {

    private final DataSourceCredentialCipher cipher = new DataSourceCredentialCipher(
            "test-only-secret-not-for-prod-use-32bytes!!", new MockEnvironment());

    @Test
    void encryptThenDecrypt_roundtrips() {
        String plaintext = "S3cr3t!Password#2026";
        String cipherText = cipher.encrypt(plaintext);

        assertTrue(cipherText.startsWith("enc:v1:"));
        assertTrue(cipher.isEncrypted(cipherText));
        assertEquals(plaintext, cipher.decrypt(cipherText));
    }

    @Test
    void encrypt_isNonDeterministic_dueToRandomIv() {
        String plaintext = "same-password";
        String first = cipher.encrypt(plaintext);
        String second = cipher.encrypt(plaintext);

        assertTrue(first.startsWith("enc:v1:"));
        assertTrue(second.startsWith("enc:v1:"));
        assertNotEquals(first, second);
        assertEquals(plaintext, cipher.decrypt(first));
        assertEquals(plaintext, cipher.decrypt(second));
    }

    @Test
    void decrypt_legacyPlaintext_passesThroughUnchanged() {
        String legacyPlaintext = "old-plain-password";
        assertEquals(legacyPlaintext, cipher.decrypt(legacyPlaintext));
    }

    @Test
    void encrypt_isIdempotent_doesNotDoubleEncrypt() {
        String once = cipher.encrypt("hunter2");
        String twice = cipher.encrypt(once);
        assertEquals(once, twice);
    }

    @Test
    void encryptAndDecrypt_nullAndBlank_passThrough() {
        assertNull(cipher.encrypt(null));
        assertNull(cipher.decrypt(null));
        assertEquals("", cipher.encrypt(""));
        assertEquals("", cipher.decrypt(""));
    }

    @Test
    void decrypt_tamperedCiphertext_throws() {
        String cipherText = cipher.encrypt("tamper-me");
        String tampered = cipherText.substring(0, cipherText.length() - 4) + "AAAA";
        assertThrows(IllegalStateException.class, () -> cipher.decrypt(tampered));
    }

    @Test
    void decrypt_wrongKey_throws() {
        String cipherText = cipher.encrypt("cross-key-secret");
        DataSourceCredentialCipher otherKeyCipher = new DataSourceCredentialCipher(
                "a-completely-different-secret-32bytes!!", new MockEnvironment());
        assertThrows(IllegalStateException.class, () -> otherKeyCipher.decrypt(cipherText));
    }

    @Test
    void encryptInPlaceThenDecryptInPlace_roundtripsEntityFields() {
        DataSources ds = new DataSources();
        ds.setUsername("root");
        ds.setPassword("root-secret");

        cipher.encryptInPlace(ds);
        assertTrue(cipher.isEncrypted(ds.getUsername()));
        assertTrue(cipher.isEncrypted(ds.getPassword()));

        cipher.decryptInPlace(ds);
        assertEquals("root", ds.getUsername());
        assertEquals("root-secret", ds.getPassword());
    }

    @Test
    void decryptInPlace_null_isNoOp() {
        cipher.decryptInPlace(null);
        cipher.encryptInPlace(null);
        // no exception
    }

    @Test
    void prodProfile_blankSecret_failsFast() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                () -> new DataSourceCredentialCipher("", prodEnv));
    }

    @Test
    void prodProfile_repositoryDevDefault_failsFast() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                () -> new DataSourceCredentialCipher(DataSourceCredentialCipher.INSECURE_DEV_DEFAULT, prodEnv));
    }

    @Test
    void prodProfile_realSecret_startsUpFine() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        DataSourceCredentialCipher prodCipher =
                new DataSourceCredentialCipher("a-real-rotated-production-secret-value", prodEnv);
        String cipherText = prodCipher.encrypt("prod-password");
        assertEquals("prod-password", prodCipher.decrypt(cipherText));
    }

    @Test
    void devProfile_blankSecret_doesNotThrow() {
        MockEnvironment devEnv = new MockEnvironment();
        DataSourceCredentialCipher devCipher = new DataSourceCredentialCipher("", devEnv);
        String cipherText = devCipher.encrypt("dev-password");
        assertEquals("dev-password", devCipher.decrypt(cipherText));
    }
}
