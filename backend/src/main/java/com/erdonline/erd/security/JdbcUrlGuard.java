package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;

import java.net.URI;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Blocks non-RDBMS JDBC schemes and common cloud-metadata SSRF targets for connector paths.
 */
public final class JdbcUrlGuard {

    private static final Set<String> BLOCKED_HOSTS = Set.of(
            "169.254.169.254",
            "metadata.google.internal",
            "metadata",
            "metadata.goog"
    );

    /** jdbc:mysql://host:3306/db or jdbc:oracle:thin:@host:1521:ORCL / @//host:1521/svc */
    private static final Pattern HOST_IN_URL = Pattern.compile(
            "(?i)jdbc:(?:mysql|mariadb|postgresql|sqlserver|jtds:sqlserver)://([^/:?;]+)"
                    + "|jdbc:oracle:(?:thin|oci):@(?://)?([^/:?;]+)");

    private JdbcUrlGuard() {
    }

    public static void assertAllowed(String url) {
        if (url == null || url.isBlank()) {
            throw new ValidateException("JDBC URL 不能为空");
        }
        String trimmed = url.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("jdbc:")) {
            throw new ValidateException("仅允许 jdbc: 连接串");
        }
        if (!schemeAllowed(lower)) {
            throw new ValidateException("不支持的 JDBC 协议，仅允许 mysql/mariadb/postgresql/oracle/sqlserver");
        }
        String host = extractHost(trimmed);
        if (host != null && BLOCKED_HOSTS.contains(host.toLowerCase(Locale.ROOT))) {
            throw new ValidateException("禁止连接云元数据地址");
        }
        // Reject odd URI schemes smuggled after jdbc: (e.g. jdbc:mysql:ldap:...)
        rejectEmbeddedSchemes(lower);
    }

    private static boolean schemeAllowed(String lowerUrl) {
        return lowerUrl.startsWith("jdbc:mysql://")
                || lowerUrl.startsWith("jdbc:mariadb://")
                || lowerUrl.startsWith("jdbc:postgresql://")
                || lowerUrl.startsWith("jdbc:sqlserver://")
                || lowerUrl.startsWith("jdbc:jtds:sqlserver://")
                || lowerUrl.startsWith("jdbc:oracle:thin:@")
                || lowerUrl.startsWith("jdbc:oracle:oci:@");
    }

    private static void rejectEmbeddedSchemes(String lowerUrl) {
        // after first scheme token, forbid another "://..." protocol injection via query rewrite tricks
        int first = lowerUrl.indexOf("://");
        if (first < 0) {
            return;
        }
        String rest = lowerUrl.substring(first + 3);
        if (rest.contains("://") || rest.contains("@jdbc:") || rest.contains("ldap://") || rest.contains("rmi://")) {
            throw new ValidateException("非法 JDBC URL");
        }
        try {
            // Best-effort parse of host portion when URI-compatible
            URI.create(lowerUrl.replaceFirst("(?i)^jdbc:", ""));
        } catch (IllegalArgumentException ignored) {
            // non-URI oracle forms are OK if scheme/host already checked
        }
    }

    static String extractHost(String url) {
        Matcher m = HOST_IN_URL.matcher(url);
        if (!m.find()) {
            return null;
        }
        String host = m.group(1) != null ? m.group(1) : m.group(2);
        if (host == null) {
            return null;
        }
        // strip IPv6 brackets
        if (host.startsWith("[") && host.endsWith("]")) {
            return host.substring(1, host.length() - 1);
        }
        return host;
    }
}
