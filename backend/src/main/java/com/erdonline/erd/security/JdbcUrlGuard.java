package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Blocks non-RDBMS JDBC schemes and cloud-metadata / link-local SSRF targets for connector paths.
 *
 * <p>Does <strong>not</strong> block RFC1918 / localhost — self-hosted DBs on private nets
 * (including PaaS private networking to customer MySQL) are the primary product use case.
 * Dialed-in deny list: link-local, known cloud IMDS endpoints — applied to literal hosts
 * <em>and</em> to DNS-resolved A/AAAA records (closes CNAME → metadata rebinding at check time).
 */
public final class JdbcUrlGuard {

    private static final Set<String> BLOCKED_HOSTNAMES = Set.of(
            "169.254.169.254",
            "metadata.google.internal",
            "metadata",
            "metadata.goog",
            "metadata.google",
            "instance-data"
    );

    /** jdbc:mysql://host:3306/db ; bracketed IPv6; oracle thin/oci @ forms */
    private static final Pattern HOST_IN_URL = Pattern.compile(
            "(?i)jdbc:(?:mysql|mariadb|postgresql|sqlserver|jtds:sqlserver)://"
                    + "(?:\\[([^\\]]+)\\]|([^/:?;]+))"
                    + "|jdbc:oracle:(?:thin|oci):@(?://)?(?:\\[([^\\]]+)\\]|([^/:?;]+))");

    @FunctionalInterface
    interface HostAddressResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    private static final HostAddressResolver DEFAULT_RESOLVER = InetAddress::getAllByName;

    private JdbcUrlGuard() {
    }

    public static void assertAllowed(String url) {
        assertAllowed(url, DEFAULT_RESOLVER);
    }

    /** Package-visible for DNS-injection tests. */
    static void assertAllowed(String url, HostAddressResolver resolver) {
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
        if (host != null && isBlockedHost(host, resolver)) {
            throw new ValidateException("禁止连接云元数据或链路本地地址");
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

    static boolean isBlockedHost(String host) {
        return isBlockedHost(host, DEFAULT_RESOLVER);
    }

    /**
     * True when the host name is a known metadata alias, or any literal / DNS-resolved address
     * falls in the IMDS / link-local deny list. RFC1918 and other private ranges are allowed.
     */
    static boolean isBlockedHost(String host, HostAddressResolver resolver) {
        if (host == null || host.isBlank()) {
            return false;
        }
        String h = host.trim().toLowerCase(Locale.ROOT);
        int zone = h.indexOf('%');
        if (zone >= 0) {
            h = h.substring(0, zone);
        }
        if (BLOCKED_HOSTNAMES.contains(h)) {
            return true;
        }
        if (looksLikeLiteralIp(h)) {
            try {
                InetAddress addr = InetAddress.getByName(h);
                return isBlockedAddress(addr.getAddress());
            } catch (UnknownHostException e) {
                return false;
            }
        }
        return resolvesToBlockedAddress(h, resolver);
    }

    /**
     * Resolve hostname and block if <em>any</em> A/AAAA is link-local / cloud IMDS.
     * Unresolvable hosts pass (connection fails later); does not blanket-ban RFC1918.
     */
    private static boolean resolvesToBlockedAddress(String host, HostAddressResolver resolver) {
        try {
            InetAddress[] addrs = resolver.resolve(host);
            if (addrs == null) {
                return false;
            }
            for (InetAddress addr : addrs) {
                if (addr != null && isBlockedAddress(addr.getAddress())) {
                    return true;
                }
            }
            return false;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    /** Literal IPv4 / IPv6 only — avoid DNS side effects from {@link InetAddress#getByName}. */
    private static boolean looksLikeLiteralIp(String h) {
        if (h.indexOf(':') >= 0) {
            return true;
        }
        for (int i = 0; i < h.length(); i++) {
            char c = h.charAt(i);
            if (c != '.' && (c < '0' || c > '9')) {
                return false;
            }
        }
        return h.indexOf('.') >= 0;
    }

    private static boolean isBlockedAddress(byte[] raw) {
        if (raw == null) {
            return false;
        }
        if (raw.length == 16 && isIpv4Mapped(raw)) {
            byte[] v4 = new byte[]{raw[12], raw[13], raw[14], raw[15]};
            return isBlockedIpv4(v4);
        }
        if (raw.length == 4) {
            return isBlockedIpv4(raw);
        }
        if (raw.length == 16) {
            return isBlockedIpv6(raw);
        }
        return false;
    }

    private static boolean isIpv4Mapped(byte[] raw) {
        for (int i = 0; i < 10; i++) {
            if (raw[i] != 0) {
                return false;
            }
        }
        return (raw[10] & 0xff) == 0xff && (raw[11] & 0xff) == 0xff;
    }

    private static boolean isBlockedIpv4(byte[] raw) {
        int a = raw[0] & 0xff;
        int b = raw[1] & 0xff;
        int c = raw[2] & 0xff;
        int d = raw[3] & 0xff;
        // Link-local 169.254.0.0/16 (incl. AWS/GCP IMDS 169.254.169.254)
        if (a == 169 && b == 254) {
            return true;
        }
        // Azure WireServer / IMDS
        if (a == 168 && b == 63 && c == 129 && d == 16) {
            return true;
        }
        // Alibaba Cloud metadata
        if (a == 100 && b == 100 && c == 100 && d == 200) {
            return true;
        }
        return false;
    }

    private static boolean isBlockedIpv6(byte[] raw) {
        int b0 = raw[0] & 0xff;
        int b1 = raw[1] & 0xff;
        // fe80::/10 link-local
        if (b0 == 0xfe && (b1 & 0xc0) == 0x80) {
            return true;
        }
        // AWS IMDS IPv6 fd00:ec2::254
        if (b0 == 0xfd && b1 == 0x00
                && (raw[2] & 0xff) == 0x0e && (raw[3] & 0xff) == 0xc2
                && isTrailingIpv6Host(raw, 0x02, 0x54)) {
            return true;
        }
        return false;
    }

    /** True when bytes 4..14 are zero and bytes 14..15 equal hi/lo (host suffix). */
    private static boolean isTrailingIpv6Host(byte[] raw, int hi, int lo) {
        for (int i = 4; i < 14; i++) {
            if (raw[i] != 0) {
                return false;
            }
        }
        return (raw[14] & 0xff) == hi && (raw[15] & 0xff) == lo;
    }

    static String extractHost(String url) {
        Matcher m = HOST_IN_URL.matcher(url);
        if (!m.find()) {
            return null;
        }
        for (int i = 1; i <= m.groupCount(); i++) {
            String host = m.group(i);
            if (host != null && !host.isBlank()) {
                return host;
            }
        }
        return null;
    }
}
