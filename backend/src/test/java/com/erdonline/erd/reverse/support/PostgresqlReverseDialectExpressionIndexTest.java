package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.TableIdentity;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * PostgreSQL 表达式索引：pg_get_indexdef → indexs[].fields[]（mock JDBC）。
 */
class PostgresqlReverseDialectExpressionIndexTest {

    @Test
    void fillEntity_mapsExpressionAndColumnIndexFields() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(eq("reverse_demo"), eq("public"), eq("t_user"))).thenReturn(pkRs);

        ResultSet columnsRs = mock(ResultSet.class);
        when(columnsRs.next()).thenReturn(true, false);
        when(columnsRs.getString("COLUMN_NAME")).thenReturn("id");
        when(columnsRs.getString("REMARKS")).thenReturn(null);
        when(columnsRs.getString("TYPE_NAME")).thenReturn("int8");
        when(columnsRs.getString("IS_NULLABLE")).thenReturn("NO");
        when(columnsRs.getString("COLUMN_DEF")).thenReturn(null);
        when(columnsRs.getString("IS_AUTOINCREMENT")).thenReturn("YES");
        when(columnsRs.getInt("DATA_TYPE")).thenReturn(Types.BIGINT);
        when(columnsRs.getInt("COLUMN_SIZE")).thenReturn(19);
        when(columnsRs.getInt("DECIMAL_DIGITS")).thenReturn(0);
        when(meta.getColumns(eq("reverse_demo"), eq("public"), eq("t_user"), eq("%")))
                .thenReturn(columnsRs);

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(true, true, false);
        when(indexRs.getString("INDEX_NAME")).thenReturn("idx_user_email_lower", "idx_user_email_lower");
        when(indexRs.getString("index_name")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getString("COLUMN_NAME")).thenReturn("tenant_id", "lower((email)::text)");
        when(indexRs.getString("column_name")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getInt("NON_UNIQUE")).thenReturn(1, 1);
        when(indexRs.getInt("non_unique")).thenThrow(new SQLException("uppercase only"));

        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(false);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(false);

        when(connection.prepareStatement(anyString())).thenReturn(indexStmt, triggerStmt, commentStmt);
        when(indexStmt.executeQuery()).thenReturn(indexRs);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        TableIdentity table = new TableIdentity("reverse_demo", "public", "t_user", "t_user", null);
        Entity entity = new Entity();
        ParseDataModel dataModel = new ParseDataModel();

        new PostgresqlReverseDialect().fillEntity(connection, table, entity, dataModel, "DEFAULT");

        List<Index> indexes = entity.getIndexs();
        assertEquals(1, indexes.size());
        Index index = indexes.get(0);
        assertEquals("idx_user_email_lower", index.getName());
        assertEquals(List.of("tenant_id", "lower((email)::text)"), index.getFields());
        assertTrue(index.getFields().get(1).contains("("));
    }
}
