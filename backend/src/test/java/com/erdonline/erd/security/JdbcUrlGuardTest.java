package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JdbcUrlGuardTest {

    private static InetAddress fixedIp(String hostLabel, byte[] address) throws UnknownHostException {
        return InetAddress.getByAddress(hostLabel, address);
    }

    @Test
    void allowsCommonRdbmsUrls() throws Exception {
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://127.0.0.1:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://localhost:5432/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:oracle:thin:@127.0.0.1:1521:ORCL"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed(
                "jdbc:sqlserver://localhost:1433;databaseName=erd"));
        // RFC1918 / private hostnames remain allowed (self-hosted product use case)
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://10.0.0.5:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://192.168.1.10:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://172.16.0.2:3306/erd"));
        JdbcUrlGuard.HostAddressResolver toPrivate = host -> new InetAddress[]{
                fixedIp(host, new byte[]{10, 0, 0, 5})
        };
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mariadb://db:3306/erd", toPrivate));
    }

    @Test
    void deniesArbitrarySchemesAndMetadata() {
        assertThrows(ValidateException.class, () -> JdbcUrlGuard.assertAllowed("jdbc:h2:mem:test"));
        assertThrows(ValidateException.class, () -> JdbcUrlGuard.assertAllowed("jdbc:rmi://evil"));
        assertThrows(ValidateException.class, () -> JdbcUrlGuard.assertAllowed("jdbc:mysql:ldap://evil"));
        assertThrows(ValidateException.class, () -> JdbcUrlGuard.assertAllowed("not-jdbc://x"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://169.254.169.254/latest/meta-data"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://metadata.google.internal/db"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://metadata/latest"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://instance-data/latest"));
    }

    @Test
    void deniesLinkLocalAndCloudImdsLiterals() {
        assertTrue(JdbcUrlGuard.isBlockedHost("169.254.1.1"));
        assertTrue(JdbcUrlGuard.isBlockedHost("169.254.169.254"));
        assertTrue(JdbcUrlGuard.isBlockedHost("168.63.129.16"));
        assertTrue(JdbcUrlGuard.isBlockedHost("100.100.100.200"));
        assertTrue(JdbcUrlGuard.isBlockedHost("fe80::1"));
        assertTrue(JdbcUrlGuard.isBlockedHost("fd00:ec2::254"));
        assertTrue(JdbcUrlGuard.isBlockedHost("::ffff:169.254.169.254"));

        assertFalse(JdbcUrlGuard.isBlockedHost("127.0.0.1"));
        assertFalse(JdbcUrlGuard.isBlockedHost("10.1.2.3"));
        assertFalse(JdbcUrlGuard.isBlockedHost("db.internal",
                host -> new InetAddress[]{fixedIp(host, new byte[]{10, 1, 2, 3})}));

        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://169.254.42.1:3306/x"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://168.63.129.16:3306/x"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://100.100.100.200:3306/x"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://[fe80::1]:5432/db"));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://[fd00:ec2::254]:3306/x"));
    }

    @Test
    void extractHost_parsesMysqlAndOracle() {
        assertEquals("127.0.0.1", JdbcUrlGuard.extractHost("jdbc:mysql://127.0.0.1:3306/erd"));
        assertEquals("db.example", JdbcUrlGuard.extractHost("jdbc:oracle:thin:@db.example:1521:ORCL"));
        assertEquals("fe80::1", JdbcUrlGuard.extractHost("jdbc:postgresql://[fe80::1]:5432/db"));
        assertEquals("fd00:ec2::254", JdbcUrlGuard.extractHost("jdbc:mysql://[fd00:ec2::254]:3306/x"));
    }

    @Test
    void deniesHostnameResolvingToLinkLocalOrImds() throws Exception {
        JdbcUrlGuard.HostAddressResolver toImds = host -> new InetAddress[]{
                fixedIp(host, new byte[]{(byte) 169, (byte) 254, (byte) 169, (byte) 254})
        };
        JdbcUrlGuard.HostAddressResolver toAzure = host -> new InetAddress[]{
                fixedIp(host, new byte[]{(byte) 168, 63, (byte) 129, 16})
        };
        JdbcUrlGuard.HostAddressResolver multiWithMeta = host -> new InetAddress[]{
                fixedIp(host, new byte[]{10, 0, 0, 5}),
                fixedIp(host, new byte[]{(byte) 169, (byte) 254, 1, 1})
        };

        assertTrue(JdbcUrlGuard.isBlockedHost("evil-cname.example", toImds));
        assertTrue(JdbcUrlGuard.isBlockedHost("rebinder.example", multiWithMeta));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://evil-cname.example:3306/x", toImds));
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://azure-trick.example:5432/db", toAzure));
    }

    @Test
    void allowsHostnameResolvingToRfc1918PrivateDb() throws Exception {
        // Railway / compose private networking: customer DB on RFC1918 must remain allowed
        JdbcUrlGuard.HostAddressResolver toPrivate = host -> new InetAddress[]{
                fixedIp(host, new byte[]{10, (byte) 42, 0, 7})
        };
        JdbcUrlGuard.HostAddressResolver toLoopbackName = host -> new InetAddress[]{
                fixedIp(host, new byte[]{127, 0, 0, 1})
        };

        assertFalse(JdbcUrlGuard.isBlockedHost("mysql.railway.internal", toPrivate));
        assertFalse(JdbcUrlGuard.isBlockedHost("db.internal", toLoopbackName));
        assertDoesNotThrow(
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://mysql.railway.internal:3306/erd", toPrivate));
    }

    @Test
    void unresolvableHostnameDoesNotFailClosedAtGuard() {
        JdbcUrlGuard.HostAddressResolver nx = host -> {
            throw new UnknownHostException(host);
        };
        assertFalse(JdbcUrlGuard.isBlockedHost("does-not-resolve.invalid", nx));
        assertDoesNotThrow(
                () -> JdbcUrlGuard.assertAllowed("jdbc:mysql://does-not-resolve.invalid:3306/x", nx));
    }

    @Test
    void pinRewritesHostnameToResolvedRfc1918Ip() throws Exception {
        JdbcUrlGuard.HostAddressResolver toPrivate = host -> new InetAddress[]{
                fixedIp(host, new byte[]{10, (byte) 42, 0, 7})
        };
        String pinned = JdbcUrlGuard.assertAllowedAndPin(
                "jdbc:mysql://mysql.railway.internal:3306/erd?useSSL=false", toPrivate);
        assertEquals("jdbc:mysql://10.42.0.7:3306/erd?useSSL=false", pinned);

        String oraclePinned = JdbcUrlGuard.assertAllowedAndPin(
                "jdbc:oracle:thin:@db.internal:1521:ORCL", toPrivate);
        assertEquals("jdbc:oracle:thin:@10.42.0.7:1521:ORCL", oraclePinned);
    }

    @Test
    void pinLeavesLiteralIpUnchanged() {
        String url = "jdbc:mysql://10.0.0.5:3306/erd";
        assertEquals(url, JdbcUrlGuard.assertAllowedAndPin(url));
        String v6 = "jdbc:postgresql://[2001:db8::1]:5432/db";
        assertEquals(v6, JdbcUrlGuard.assertAllowedAndPin(v6));
    }

    @Test
    void pinUsesFirstSafeAddressEvenIfLaterResolveWouldFlip() throws Exception {
        // Simulate TOCTOU: first resolve (used for pin) is private; a subsequent resolve would be IMDS.
        AtomicInteger calls = new AtomicInteger();
        JdbcUrlGuard.HostAddressResolver flipping = host -> {
            if (calls.getAndIncrement() == 0) {
                return new InetAddress[]{fixedIp(host, new byte[]{10, 0, 0, 9})};
            }
            return new InetAddress[]{
                    fixedIp(host, new byte[]{(byte) 169, (byte) 254, (byte) 169, (byte) 254})
            };
        };
        String pinned = JdbcUrlGuard.assertAllowedAndPin("jdbc:mysql://rebinder.example:3306/x", flipping);
        assertEquals("jdbc:mysql://10.0.0.9:3306/x", pinned);
        assertEquals(1, calls.get(), "connect must not re-resolve; pin closes TOCTOU");
    }

    @Test
    void pinDeniesWhenAnyResolvedAddressIsImds() throws Exception {
        JdbcUrlGuard.HostAddressResolver multiWithMeta = host -> new InetAddress[]{
                fixedIp(host, new byte[]{10, 0, 0, 5}),
                fixedIp(host, new byte[]{(byte) 169, (byte) 254, 1, 1})
        };
        assertThrows(ValidateException.class,
                () -> JdbcUrlGuard.assertAllowedAndPin("jdbc:mysql://evil.example:3306/x", multiWithMeta));
    }

    @Test
    void rewriteHost_bracketsIpv6() {
        assertEquals(
                "jdbc:mysql://[2001:db8::2]:3306/x",
                JdbcUrlGuard.rewriteHost("jdbc:mysql://db.example:3306/x", "2001:db8::2"));
        assertEquals(
                "jdbc:mysql://10.0.0.1:3306/x",
                JdbcUrlGuard.rewriteHost("jdbc:mysql://[2001:db8::1]:3306/x", "10.0.0.1"));
    }
}
