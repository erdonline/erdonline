package com.erdonline.erd.reverse;

import com.erdonline.erd.reverse.support.GenericJdbcReverseDialect;
import com.erdonline.erd.reverse.support.MysqlReverseDialect;
import com.erdonline.erd.reverse.support.OracleReverseDialect;
import com.erdonline.erd.reverse.support.PostgresqlReverseDialect;
import com.erdonline.erd.reverse.support.SqlServerReverseDialect;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 方言注册：P0 热库命中，其余走 Generic。
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
        assertTrue(dialect.capability().isSupportsForeignKey());
        assertTrue(dialect.capability().isSupportsComment());
    }

    @Test
    void resolve_oracle() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("Oracle");
        assertInstanceOf(OracleReverseDialect.class, dialect);
        assertEquals(DialectIds.ORACLE, dialect.id());
        assertTrue(dialect.capability().isSupportsSchema());
        assertTrue(dialect.capability().isSupportsIndex());
        assertTrue(dialect.capability().isSupportsForeignKey());
        assertTrue(dialect.capability().isSupportsComment());
    }

    @Test
    void resolve_sqlServer() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("Microsoft SQL Server");
        assertInstanceOf(SqlServerReverseDialect.class, dialect);
        assertEquals(DialectIds.SQLSERVER, dialect.id());
        assertTrue(dialect.capability().isSupportsSchema());
        assertTrue(dialect.capability().isSupportsIndex());
        assertTrue(dialect.capability().isSupportsForeignKey());
        assertTrue(dialect.capability().isSupportsComment());
    }

    @Test
    void resolve_unknownFallsBackToGeneric() {
        ReverseDialect dialect = ReverseDialectRegistry.resolve("H2");
        assertInstanceOf(GenericJdbcReverseDialect.class, dialect);
        assertEquals(DialectIds.GENERIC, dialect.id());
    }

    @Test
    void mysqlCapability_indexYes_schemaNo_fkYes_commentYes() {
        DialectCapability capability = ReverseDialectRegistry.resolve("MySQL").capability();
        assertTrue(capability.isSupportsIndex());
        assertTrue(capability.isSupportsAutoIncrement());
        assertTrue(capability.isSupportsForeignKey());
        assertTrue(capability.isSupportsComment());
        assertFalse(capability.isSupportsSchema());
    }
}
