package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JdbcUrlGuardTest {

    @Test
    void allowsCommonRdbmsUrls() {
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://127.0.0.1:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mariadb://db:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://localhost:5432/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:oracle:thin:@127.0.0.1:1521:ORCL"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed(
                "jdbc:sqlserver://localhost:1433;databaseName=erd"));
        // RFC1918 / private hostnames remain allowed (self-hosted product use case)
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://10.0.0.5:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://192.168.1.10:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://172.16.0.2:3306/erd"));
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
        assertFalse(JdbcUrlGuard.isBlockedHost("db.internal"));

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
}
