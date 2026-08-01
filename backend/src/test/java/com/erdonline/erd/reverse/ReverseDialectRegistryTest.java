package com.erdonline.erd.reverse;

import com.erdonline.erd.reverse.support.GenericJdbcReverseDialect;
import com.erdonline.erd.reverse.support.MysqlReverseDialect;
import com.erdonline.erd.reverse.support.OracleReverseDialect;
import com.erdonline.erd.reverse.support.PostgresqlReverseDialect;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 方言注册：MySQL/MariaDB、PostgreSQL 命中，其余走 Generic。
 */
class ReverseDialectRegistryTest {

    @Test
    void resolve_mysqlAndMariaDb() {
        assertInstanceOf(MysqlReverseDialect.class, ReverseDialectRegistry.resolve("MySQL"));
        assertInstanceOf(MysqlReverseDialect.class, ReverseDialectRegistry.resolve("MariaDB"));
        assertEquals(DialectIds.MYSQL, ReverseDialectRegistry.resolve("MySQL").id());
    }

    @Test
    void resolve_postgresql() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("PostgreSQL");
        assertInstanceOf(PostgresqlReverseDialect.class, dialect);
        assertEquals(DialectIds.POSTGRESQL, dialect.id());
        assertTrue(dialect.capability().isSupportsSchema());
        assertTrue(dialect.capability().isSupportsIndex());
    }

    @Test
    void resolve_oracle() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("Oracle");
        assertInstanceOf(OracleReverseDialect.class, dialect);
        assertEquals(DialectIds.ORACLE, dialect.id());
        assertTrue(dialect.capability().isSupportsSchema());
        assertTrue(dialect.capability().isSupportsIndex());
    }

    @Test
    void resolve_unknownFallsBackToGeneric() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("Microsoft SQL Server");
        assertInstanceOf(GenericJdbcReverseDialect.class, dialect);
        assertEquals(DialectIds.GENERIC, dialect.id());
    }

    @Test
    void mysqlCapability_indexYes_schemaNo() {
        DialectCapability capability = ReverseDialectRegistry.resolve("MySQL").capability();
        assertTrue(capability.isSupportsIndex());
        assertTrue(capability.isSupportsAutoIncrement());
        assertFalse(capability.isSupportsSchema());
    }
}
