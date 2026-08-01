package com.erdonline.erd.reverse;

import com.erdonline.erd.reverse.support.GenericJdbcReverseDialect;
import com.erdonline.erd.reverse.support.MysqlReverseDialect;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 方言注册：MySQL/MariaDB 命中，其余走 Generic。
 */
class ReverseDialectRegistryTest {

    @Test
    void resolve_mysqlAndMariaDb() {
        assertInstanceOf(MysqlReverseDialect.class, ReverseDialectRegistry.resolve("MySQL"));
        assertInstanceOf(MysqlReverseDialect.class, ReverseDialectRegistry.resolve("MariaDB"));
        assertEquals(DialectIds.MYSQL, ReverseDialectRegistry.resolve("MySQL").id());
    }

    @Test
    void resolve_unknownFallsBackToGeneric() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("PostgreSQL");
        assertInstanceOf(GenericJdbcReverseDialect.class, dialect);
        assertEquals(DialectIds.GENERIC, dialect.id());
    }

    @Test
    void mysqlCapability_indexYes_schemaNo() {
        DialectCapability capability = ReverseDialectRegistry.resolve("MySQL").capability();
        assertTrue(capability.isSupportsIndex());
        assertTrue(capability.isSupportsAutoIncrement());
        assertEquals(false, capability.isSupportsSchema());
    }
}
