package com.erdonline.erd.security;

import com.erdonline.common.core.exception.ValidateException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SqlGuardTest {

    @Test
    void readOnly_allowsSelectShowExplainDesc() {
        assertEquals("SELECT 1", SqlGuard.assertReadOnly("SELECT 1;"));
        assertDoesNotThrow(() -> SqlGuard.assertReadOnly("SHOW TABLES"));
        assertDoesNotThrow(() -> SqlGuard.assertReadOnly("EXPLAIN SELECT id FROM t"));
        assertDoesNotThrow(() -> SqlGuard.assertReadOnly("DESC users"));
        assertDoesNotThrow(() -> SqlGuard.assertReadOnly("DESCRIBE users"));
    }

    @Test
    void readOnly_deniesDmlDdlAndMultiStatement() {
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("DROP TABLE users"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("DELETE FROM users"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("UPDATE users SET a=1"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("INSERT INTO t VALUES (1)"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("ALTER TABLE t ADD c INT"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertReadOnly("SELECT 1; DROP TABLE users"));
        ValidateException grant = assertThrows(ValidateException.class,
                () -> SqlGuard.assertReadOnly("GRANT ALL ON *.* TO 'x'@'%'"));
        assertTrue(grant.getMessage().contains("禁止") || grant.getMessage().contains("白名单")
                || grant.getMessage().contains("只读"));
    }

    @Test
    void mutate_allowsDdlButDeniesGrantAndOutfile() {
        assertDoesNotThrow(() -> SqlGuard.assertMutateAllowed("CREATE TABLE t (id INT)"));
        assertDoesNotThrow(() -> SqlGuard.assertMutateAllowed("ALTER TABLE t ADD COLUMN c INT"));
        assertDoesNotThrow(() -> SqlGuard.assertMutateAllowed("DROP TABLE t"));
        assertDoesNotThrow(() -> SqlGuard.assertMutateAllowed("INSERT INTO t VALUES (1)"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertMutateAllowed("GRANT ALL ON *.* TO 'x'@'%'"));
        assertThrows(ValidateException.class,
                () -> SqlGuard.assertMutateAllowed("SELECT * FROM t INTO OUTFILE '/tmp/x'"));
        assertThrows(ValidateException.class, () -> SqlGuard.assertMutateAllowed("CREATE USER 'x'@'%' IDENTIFIED BY 'p'"));
    }
}
