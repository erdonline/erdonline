package com.erdonline.config;

import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * HTTP CORS / SocketIO Origin 解析与 prod 门禁（R-CFG-04）。
 *
 * <p>非 prod：允许本地默认与 SocketIO {@code *}，保障 {@code localhost:8000} dogfood。
 * prod：禁止通配；须 {@code CORS_ALLOWED_ORIGINS} / {@code ERD_UI_URL} / {@code SOCKETIO_ORIGIN}
 *（yml 无默认，对齐 JWT_SECRET fail-fast）。</p>
 */
public final class CrossOriginPolicy {

    /** 本地/dev HTTP CORS 默认（与历史 CorsConfig 一致）。 */
    public static final String DEV_DEFAULT_ORIGINS =
            "http://localhost:8000,http://127.0.0.1:8000";

    public static final String INSECURE_WILDCARD = "*";

    private CrossOriginPolicy() {
    }

    public static boolean isProd(Environment env) {
        return Arrays.asList(env.getActiveProfiles()).contains("prod");
    }

    /**
     * 解析 HTTP 允许 Origin：{@code CORS_ALLOWED_ORIGINS} → {@code martin.ui.url}/{@code ERD_UI_URL}
     * → 非 prod 本地默认；prod 缺配置或含 {@code *} 则失败。
     */
    public static List<String> resolveHttpAllowedOrigins(Environment env) {
        String explicit = firstNonBlank(
                env.getProperty("CORS_ALLOWED_ORIGINS"),
                getenv("CORS_ALLOWED_ORIGINS"));
        if (explicit != null) {
            List<String> list = splitCsv(explicit);
            assertNoWildcard(list, env, "CORS_ALLOWED_ORIGINS");
            if (list.isEmpty()) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS is blank after trim: set comma-separated UI origins");
            }
            return list;
        }

        String ui = firstNonBlank(
                env.getProperty("martin.ui.url"),
                env.getProperty("ERD_UI_URL"),
                getenv("ERD_UI_URL"));
        if (ui != null) {
            assertNoWildcard(List.of(ui), env, "ERD_UI_URL / martin.ui.url");
            return List.of(ui);
        }

        if (isProd(env)) {
            throw new IllegalStateException(
                    "prod CORS: set CORS_ALLOWED_ORIGINS or ERD_UI_URL (wildcard * forbidden)");
        }
        return splitCsv(DEV_DEFAULT_ORIGINS);
    }

    /**
     * prod：拒绝 blank / {@code *}（即使显式 {@code SOCKETIO_ORIGIN=*}）。
     * 非 prod：放行 application.yml 默认 {@code *}。
     */
    public static void assertSocketIoOriginSafeForProfile(String origin, Environment env) {
        if (!isProd(env)) {
            return;
        }
        if (origin == null || origin.isBlank() || INSECURE_WILDCARD.equals(origin.trim())) {
            throw new IllegalStateException(
                    "martin.socketio.origin is blank or *: set SOCKETIO_ORIGIN or ERD_UI_URL "
                            + "to the UI origin (not *)");
        }
    }

    static void assertNoWildcard(List<String> origins, Environment env, String source) {
        if (!isProd(env)) {
            return;
        }
        for (String o : origins) {
            if (INSECURE_WILDCARD.equals(o)) {
                throw new IllegalStateException(
                        source + " must not be * in prod; set explicit UI origin(s)");
            }
        }
    }

    static List<String> splitCsv(String csv) {
        List<String> out = new ArrayList<>();
        for (String part : csv.split(",")) {
            String t = part.trim();
            if (!t.isEmpty()) {
                out.add(t);
            }
        }
        return out;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null) {
                String t = v.trim();
                if (!t.isEmpty()) {
                    return t;
                }
            }
        }
        return null;
    }

    /** 可测包装；生产走真实环境变量。 */
    static String getenv(String name) {
        return System.getenv(name);
    }
}
