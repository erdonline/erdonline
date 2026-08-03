package com.erdonline.config;

import org.springframework.core.env.Environment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * HTTP CORS / SocketIO Origin 解析与 prod 门禁（R-CFG-04）。
 *
 * <p>非 prod：允许本地默认与 SocketIO {@code *}，保障 {@code localhost:8000} dogfood。
 * prod：禁止通配；须 {@code ERD_UI_URL}（绑定 {@code martin.ui.url} / {@code martin.socketio.origin}），
 * yml 无默认，对齐 JWT_SECRET fail-fast。</p>
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
     * 解析 HTTP 允许 Origin：仅 {@code martin.ui.url}（prod 由 {@code ERD_UI_URL} 注入）；
     * 非 prod 缺配置时回落本地默认；prod 缺配置或含 {@code *} 则失败。
     */
    public static List<String> resolveHttpAllowedOrigins(Environment env) {
        String ui = firstNonBlank(env.getProperty("martin.ui.url"));
        if (ui != null) {
            List<String> list = splitCsv(ui);
            assertNoWildcard(list, env, "martin.ui.url / ERD_UI_URL");
            if (list.isEmpty()) {
                throw new IllegalStateException(
                        "martin.ui.url is blank after trim: set ERD_UI_URL to the UI origin");
            }
            return list;
        }

        if (isProd(env)) {
            throw new IllegalStateException(
                    "prod CORS: set ERD_UI_URL (wildcard * forbidden)");
        }
        return splitCsv(DEV_DEFAULT_ORIGINS);
    }

    /**
     * prod：拒绝 blank / {@code *}。
     * 非 prod：放行 application.yml 默认 {@code *}。
     */
    public static void assertSocketIoOriginSafeForProfile(String origin, Environment env) {
        if (!isProd(env)) {
            return;
        }
        if (origin == null || origin.isBlank() || INSECURE_WILDCARD.equals(origin.trim())) {
            throw new IllegalStateException(
                    "martin.socketio.origin is blank or *: set ERD_UI_URL "
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
}
