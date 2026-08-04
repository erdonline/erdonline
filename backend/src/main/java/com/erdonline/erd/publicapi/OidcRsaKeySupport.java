package com.erdonline.erd.publicapi;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.util.Base64;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OIDC RSA 密钥加载 / 开发态自动生成；编解码器与 JWKS 材料。
 */
final class OidcRsaKeySupport {

    static final Path DEV_AUTOGEN_PATH =
            Path.of(System.getProperty("user.home"), ".erdonline", "oidc-rsa-private.pem");

    private OidcRsaKeySupport() {
    }

    record Loaded(RSAKey signingKey, JwtEncoder encoder, JwtDecoder decoder) {
        Map<String, Object> jwksDocument() {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("keys", List.of(signingKey.toPublicJWK().toJSONObject()));
            return body;
        }

        String keyId() {
            return signingKey.getKeyID();
        }
    }

    static Loaded load(OidcProperties props, Environment env) {
        boolean prod = env != null && Arrays.asList(env.getActiveProfiles()).contains("prod");
        try {
            RSAKey key = resolveKey(props, prod);
            JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(key)));
            JwtDecoder decoder = NimbusJwtDecoder.withPublicKey(key.toRSAPublicKey())
                    .signatureAlgorithm(SignatureAlgorithm.RS256)
                    .build();
            return new Loaded(key, encoder, decoder);
        } catch (JOSEException e) {
            throw new IllegalStateException("OIDC RSA key material unusable: " + e.getMessage(), e);
        }
    }

    static RSAKey resolveKey(OidcProperties props, boolean prod) throws JOSEException {
        if (StringUtils.hasText(props.getRsaPrivateKey())) {
            return fromPem(props.getRsaPrivateKey().trim(), props.getRsaKeyId());
        }
        if (StringUtils.hasText(props.getRsaPrivateKeyPath())) {
            Path path = Path.of(props.getRsaPrivateKeyPath().trim());
            if (!Files.isRegularFile(path)) {
                throw new IllegalStateException(
                        "erd.oidc.rsa-private-key-path does not exist: " + path
                                + " (set ERD_OIDC_RSA_PRIVATE_KEY_PATH or ERD_OIDC_RSA_PRIVATE_KEY)");
            }
            try {
                return fromPem(Files.readString(path), props.getRsaKeyId());
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to read OIDC RSA PEM: " + path, e);
            }
        }
        if (StringUtils.hasText(props.getRsaKeystorePath())) {
            return fromKeystore(props);
        }
        if (prod) {
            throw new IllegalStateException(
                    "OIDC RSA private key missing in prod: set ERD_OIDC_RSA_PRIVATE_KEY (PEM) "
                            + "or ERD_OIDC_RSA_PRIVATE_KEY_PATH (PEM file) "
                            + "or ERD_OIDC_RSA_KEYSTORE_PATH (PKCS12)");
        }
        return loadOrAutogenDev(props.getRsaKeyId());
    }

    static RSAKey loadOrAutogenDev(String configuredKid) throws JOSEException {
        Path path = DEV_AUTOGEN_PATH;
        if (Files.isRegularFile(path)) {
            try {
                return fromPem(Files.readString(path), configuredKid);
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to read auto-generated OIDC RSA PEM: " + path, e);
            }
        }
        RSAKey generated = new RSAKeyGenerator(2048)
                .keyUse(KeyUse.SIGNATURE)
                .keyID("tmp")
                .generate();
        RSAKey withKid = withKid(generated, configuredKid);
        try {
            Files.createDirectories(path.getParent());
            Files.writeString(path, toPkcs8Pem(withKid), StandardCharsets.US_ASCII);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write auto-generated OIDC RSA PEM: " + path, e);
        }
        return withKid;
    }

    static RSAKey fromPem(String pem, String configuredKid) throws JOSEException {
        String normalized = pem.replace("\r\n", "\n").trim();
        PrivateKey privateKey = parsePrivateKeyPem(normalized);
        if (!(privateKey instanceof RSAPrivateKey rsaPrivate)) {
            throw new IllegalStateException("OIDC PEM is not an RSA private key");
        }
        RSAPublicKey publicKey = derivePublicKey(rsaPrivate);
        RSAKey built = new RSAKey.Builder(publicKey)
                .privateKey(rsaPrivate)
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(com.nimbusds.jose.JWSAlgorithm.RS256)
                .build();
        return withKid(built, configuredKid);
    }

    static RSAKey fromKeystore(OidcProperties props) throws JOSEException {
        Path path = Path.of(props.getRsaKeystorePath().trim());
        if (!Files.isRegularFile(path)) {
            throw new IllegalStateException(
                    "erd.oidc.rsa-keystore-path does not exist: " + path);
        }
        char[] password = props.getRsaKeystorePassword() != null
                ? props.getRsaKeystorePassword().toCharArray()
                : new char[0];
        try {
            KeyStore ks = KeyStore.getInstance("PKCS12");
            try (InputStream in = Files.newInputStream(path)) {
                ks.load(in, password);
            }
            String alias = props.getRsaKeyAlias();
            if (!StringUtils.hasText(alias)) {
                alias = firstKeyAlias(ks);
            }
            if (!StringUtils.hasText(alias)) {
                throw new IllegalStateException("OIDC PKCS12 keystore has no private key entries: " + path);
            }
            RSAKey loaded = RSAKey.load(ks, alias, password);
            if (loaded == null || !loaded.isPrivate()) {
                throw new IllegalStateException("OIDC PKCS12 alias has no RSA private key: " + alias);
            }
            RSAKey withAlg = new RSAKey.Builder(loaded)
                    .keyUse(KeyUse.SIGNATURE)
                    .algorithm(com.nimbusds.jose.JWSAlgorithm.RS256)
                    .build();
            return withKid(withAlg, props.getRsaKeyId());
        } catch (JOSEException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load OIDC PKCS12: " + path + ": " + e.getMessage(), e);
        }
    }

    private static String firstKeyAlias(KeyStore ks) throws Exception {
        Enumeration<String> aliases = ks.aliases();
        while (aliases.hasMoreElements()) {
            String a = aliases.nextElement();
            if (ks.isKeyEntry(a)) {
                return a;
            }
        }
        return null;
    }

    static RSAKey withKid(RSAKey key, String configuredKid) throws JOSEException {
        if (StringUtils.hasText(configuredKid)) {
            return new RSAKey.Builder(key).keyID(configuredKid.trim()).build();
        }
        if (StringUtils.hasText(key.getKeyID()) && !"tmp".equals(key.getKeyID())) {
            return key;
        }
        return new RSAKey.Builder(key).keyIDFromThumbprint().build();
    }

    static String toPkcs8Pem(RSAKey key) throws JOSEException {
        byte[] encoded = key.toPrivateKey().getEncoded();
        String b64 = Base64.encode(encoded).toString();
        StringBuilder sb = new StringBuilder();
        sb.append("-----BEGIN PRIVATE KEY-----\n");
        for (int i = 0; i < b64.length(); i += 64) {
            sb.append(b64, i, Math.min(i + 64, b64.length())).append('\n');
        }
        sb.append("-----END PRIVATE KEY-----\n");
        return sb.toString();
    }

    /**
     * PKCS#8 ({@code BEGIN PRIVATE KEY}) 或 PKCS#1 ({@code BEGIN RSA PRIVATE KEY}).
     * PKCS#1 经合成 PKCS#8 包装后用 JDK KeyFactory 解析。
     */
    static PrivateKey parsePrivateKeyPem(String pem) {
        try {
            if (pem.contains("BEGIN PRIVATE KEY")) {
                byte[] der = decodePemBody(pem, "PRIVATE KEY");
                return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
            }
            if (pem.contains("BEGIN RSA PRIVATE KEY")) {
                byte[] pkcs1 = decodePemBody(pem, "RSA PRIVATE KEY");
                byte[] pkcs8 = wrapPkcs1ToPkcs8(pkcs1);
                return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
            }
            throw new IllegalStateException(
                    "OIDC PEM must be PKCS#8 (BEGIN PRIVATE KEY) or PKCS#1 (BEGIN RSA PRIVATE KEY)");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse OIDC RSA PEM: " + e.getMessage(), e);
        }
    }

    private static byte[] decodePemBody(String pem, String label) {
        String begin = "-----BEGIN " + label + "-----";
        String end = "-----END " + label + "-----";
        int start = pem.indexOf(begin);
        int stop = pem.indexOf(end);
        if (start < 0 || stop < 0) {
            throw new IllegalStateException("Malformed PEM: missing " + label + " markers");
        }
        String body = pem.substring(start + begin.length(), stop).replaceAll("\\s", "");
        return java.util.Base64.getDecoder().decode(body);
    }

    /** RFC 5958 / PKCS#8 PrivateKeyInfo for rsaEncryption + OCTET STRING of PKCS#1. */
    private static byte[] wrapPkcs1ToPkcs8(byte[] pkcs1) {
        byte[] oid = new byte[]{
                0x30, 0x0d,
                0x06, 0x09, 0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
                0x05, 0x00
        };
        byte[] octets = derOctetString(pkcs1);
        byte[] version = new byte[]{0x02, 0x01, 0x00};
        return derSequence(concat(version, oid, octets));
    }

    private static byte[] derOctetString(byte[] content) {
        return concat(new byte[]{0x04}, derLength(content.length), content);
    }

    private static byte[] derSequence(byte[] content) {
        return concat(new byte[]{0x30}, derLength(content.length), content);
    }

    private static byte[] derLength(int len) {
        if (len < 0x80) {
            return new byte[]{(byte) len};
        }
        if (len <= 0xff) {
            return new byte[]{(byte) 0x81, (byte) len};
        }
        return new byte[]{(byte) 0x82, (byte) (len >> 8), (byte) len};
    }

    private static byte[] concat(byte[]... parts) {
        int n = 0;
        for (byte[] p : parts) {
            n += p.length;
        }
        byte[] out = new byte[n];
        int i = 0;
        for (byte[] p : parts) {
            System.arraycopy(p, 0, out, i, p.length);
            i += p.length;
        }
        return out;
    }

    static RSAPublicKey derivePublicKey(RSAPrivateKey privateKey) throws JOSEException {
        try {
            if (privateKey instanceof RSAPrivateCrtKey crt) {
                RSAPublicKeySpec spec = new RSAPublicKeySpec(crt.getModulus(), crt.getPublicExponent());
                return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
            }
            throw new IllegalStateException(
                    "OIDC RSA private key lacks CRT parameters (need RSAPrivateCrtKey to derive public)");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new JOSEException("Failed to derive RSA public key: " + e.getMessage(), e);
        }
    }
}
