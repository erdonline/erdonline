package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * ADR-0013 公开 API scope。本切片仅解锁只读；写 scope 预留名但铸造时拒绝。
 */
public final class PatScopes {

    public static final String PROJECTS_READ = "projects:read";
    public static final String VERSIONS_READ = "versions:read";

    /** 预留，本切片不可铸造 */
    public static final String PROJECTS_WRITE = "projects:write";
    public static final String VERSIONS_WRITE = "versions:write";

    public static final Set<String> DEFAULT_READ =
            Set.of(PROJECTS_READ, VERSIONS_READ);

    public static final Set<String> MINTABLE = DEFAULT_READ;

    private static final Set<String> ALL_KNOWN = Set.of(
            PROJECTS_READ, VERSIONS_READ, PROJECTS_WRITE, VERSIONS_WRITE);

    private PatScopes() {
    }

    public static Set<String> parse(String csv) {
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public static String toCsv(Set<String> scopes) {
        return scopes.stream().sorted().collect(Collectors.joining(","));
    }

    /**
     * @return normalized mintable scopes
     * @throws IllegalArgumentException unknown or not-yet-unlocked scopes
     */
    public static Set<String> normalizeForMint(Iterable<String> requested) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (requested == null) {
            out.addAll(DEFAULT_READ);
            return out;
        }
        boolean any = false;
        for (String raw : requested) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            any = true;
            String s = raw.trim().toLowerCase(Locale.ROOT);
            if (!ALL_KNOWN.contains(s)) {
                throw new IllegalArgumentException("unknown scope: " + s);
            }
            if (!MINTABLE.contains(s)) {
                throw new IllegalArgumentException("scope not unlocked in this milestone: " + s);
            }
            out.add(s);
        }
        if (!any) {
            out.addAll(DEFAULT_READ);
        }
        return out;
    }

    public static boolean has(Set<String> scopes, String required) {
        return scopes != null && scopes.contains(required);
    }

    /** Current PAT principal authorities must include {@code required}. */
    public static void require(Set<String> authorities, String required) {
        if (!has(authorities, required)) {
            throw new ValidateException(ApiErrorCode.FORBIDDEN);
        }
    }
}
