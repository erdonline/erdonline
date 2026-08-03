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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * SQL Server 计算列索引：sys.computed_columns.definition → indexs[].fields[]（mock JDBC）；回退。
 */
class SqlServerReverseDialectExpressionIndexTest {

    @Test
    void fillEntity_mapsComputedColumnDefinitionAsIndexField() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        stubColumns(meta, "reverse_demo", "dbo", "t_user");

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(true, true, false);
        when(indexRs.getString("EXPRESSION")).thenReturn(null, "(lower([email]))");
        when(indexRs.getString("expression")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getString("INDEX_NAME")).thenReturn("idx_user_email_lower", "idx_user_email_lower");
        when(indexRs.getString("index_name")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getString("COLUMN_NAME")).thenReturn("tenant_id", "email_lower");
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

        Entity entity = fill(connection);
        List<Index> indexes = entity.getIndexs();
        assertEquals(1, indexes.size());
        assertEquals("idx_user_email_lower", indexes.get(0).getName());
        assertEquals(List.of("tenant_id", "(lower([email]))"), indexes.get(0).getFields());
        assertTrue(indexes.get(0).getFields().get(1).contains("lower"));
    }

    @Test
    void loadIndexes_fallsBackToLegacySql_whenComputedColumnsUnavailable() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        stubColumns(meta, "reverse_demo", "dbo", "t_user");

        PreparedStatement indexExprStmt = mock(PreparedStatement.class);
        when(indexExprStmt.executeQuery())
                .thenThrow(new SQLException("Invalid object name 'sys.computed_columns'"));

        PreparedStatement indexLegacyStmt = mock(PreparedStatement.class);
        ResultSet legacyRs = mock(ResultSet.class);
        when(legacyRs.next()).thenReturn(true, false);
        when(legacyRs.getString("INDEX_NAME")).thenReturn("idx_email");
        when(legacyRs.getString("COLUMN_NAME")).thenReturn("email");
        when(legacyRs.getInt("NON_UNIQUE")).thenReturn(1);
        when(indexLegacyStmt.executeQuery()).thenReturn(legacyRs);

        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(false);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(false);

        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("computed_columns"))))
                .thenReturn(indexExprStmt);
        when(connection.prepareStatement(argThat(
                sql -> sql != null && sql.contains("sys.indexes")
                        && !sql.contains("computed_columns"))))
                .thenReturn(indexLegacyStmt);
        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("sys.triggers"))))
                .thenReturn(triggerStmt);
        when(connection.prepareStatement(argThat(
                sql -> sql != null && sql.contains("MS_Description") && sql.contains("column_id"))))
                .thenReturn(commentStmt);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        Entity entity = fill(connection);
        assertEquals(1, entity.getIndexs().size());
        assertEquals(List.of("email"), entity.getIndexs().get(0).getFields());
    }

    private static void stubColumns(DatabaseMetaData meta, String catalog, String schema, String table)
            throws SQLException {
        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(eq(catalog), eq(schema), eq(table))).thenReturn(pkRs);

        ResultSet columnsRs = mock(ResultSet.class);
        when(columnsRs.next()).thenReturn(true, false);
        when(columnsRs.getString("COLUMN_NAME")).thenReturn("id");
        when(columnsRs.getString("REMARKS")).thenReturn(null);
        when(columnsRs.getString("TYPE_NAME")).thenReturn("bigint");
        when(columnsRs.getString("IS_NULLABLE")).thenReturn("NO");
        when(columnsRs.getString("COLUMN_DEF")).thenReturn(null);
        when(columnsRs.getString("IS_AUTOINCREMENT")).thenReturn("YES");
        when(columnsRs.getInt("DATA_TYPE")).thenReturn(Types.BIGINT);
        when(columnsRs.getInt("COLUMN_SIZE")).thenReturn(19);
        when(columnsRs.getInt("DECIMAL_DIGITS")).thenReturn(0);
        when(meta.getColumns(eq(catalog), eq(schema), eq(table), eq("%"))).thenReturn(columnsRs);
    }

    private static Entity fill(Connection connection) throws SQLException {
        TableIdentity table = new TableIdentity("reverse_demo", "dbo", "t_user", "t_user", null);
        Entity entity = new Entity();
        new SqlServerReverseDialect().fillEntity(connection, table, entity, new ParseDataModel(), "DEFAULT");
        return entity;
    }
}
