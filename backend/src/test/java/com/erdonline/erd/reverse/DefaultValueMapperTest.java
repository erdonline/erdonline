package com.erdonline.erd.reverse;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * JDBC COLUMN_DEF → projectJSON defaultValue 规范化。
 */
class DefaultValueMapperTest {

    @Test
    void blankAndNullSql_becomeNull() {
        assertNull(DefaultValueMapper.normalizeJdbcColumnDef(null));
        assertNull(DefaultValueMapper.normalizeJdbcColumnDef(""));
        assertNull(DefaultValueMapper.normalizeJdbcColumnDef("  "));
        assertNull(DefaultValueMapper.normalizeJdbcColumnDef("NULL"));
        assertNull(DefaultValueMapper.normalizeJdbcColumnDef("null"));
    }

    @Test
    void mysqlLike_stringNumberExpression() {
        assertEquals("'NEW'", DefaultValueMapper.normalizeJdbcColumnDef("NEW"));
        assertEquals("'guest'", DefaultValueMapper.normalizeJdbcColumnDef("'guest'"));
        assertEquals("0.00", DefaultValueMapper.normalizeJdbcColumnDef("0.00"));
        assertEquals("0", DefaultValueMapper.normalizeJdbcColumnDef("0"));
        assertEquals("CURRENT_TIMESTAMP", DefaultValueMapper.normalizeJdbcColumnDef("CURRENT_TIMESTAMP"));
        assertEquals("CURRENT_TIMESTAMP", DefaultValueMapper.normalizeJdbcColumnDef("(CURRENT_TIMESTAMP)"));
        assertEquals("now()", DefaultValueMapper.normalizeJdbcColumnDef("(now())"));
    }

    @Test
    void postgresLike_typedDefaults() {
        assertEquals("'NEW'", DefaultValueMapper.normalizeJdbcColumnDef("'NEW'::character varying"));
        assertEquals("0", DefaultValueMapper.normalizeJdbcColumnDef("0::numeric"));
        assertEquals("TRUE", DefaultValueMapper.normalizeJdbcColumnDef("true"));
    }

    @Test
    void quotedEscapesAndDoubleQuotes() {
        assertEquals("'O''Brien'", DefaultValueMapper.normalizeJdbcColumnDef("'O''Brien'"));
        assertEquals("'a'", DefaultValueMapper.normalizeJdbcColumnDef("\"a\""));
        assertEquals("b'1'", DefaultValueMapper.normalizeJdbcColumnDef("b'1'"));
    }
}
