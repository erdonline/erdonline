package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JdbcUrlGuardTest {

    @Test
    void allowsCommonRdbmsUrls() {
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mysql://127.0.0.1:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:mariadb://db:3306/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:postgresql://localhost:5432/erd"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed("jdbc:oracle:thin:@127.0.0.1:1521:ORCL"));
        assertDoesNotThrow(() -> JdbcUrlGuard.assertAllowed(
                "jdbc:sqlserver://localhost:1433;databaseName=erd"));
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
    }

    @Test
    void extractHost_parsesMysqlAndOracle() {
        assertEquals("127.0.0.1", JdbcUrlGuard.extractHost("jdbc:mysql://127.0.0.1:3306/erd"));
        assertEquals("db.example", JdbcUrlGuard.extractHost("jdbc:oracle:thin:@db.example:1521:ORCL"));
    }
}
