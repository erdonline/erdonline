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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * MySQL 8 函数索引：STATISTICS.EXPRESSION → indexs[].fields[]（mock JDBC）；无列回退。
 */
class MysqlReverseDialectExpressionIndexTest {

    @Test
    void fillEntity_mapsFunctionalIndexExpression() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        stubColumns(meta, "reverse_demo", "t_user");

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(true, false);
        when(indexRs.getString("INDEX_NAME")).thenReturn("idx_func_email");
        when(indexRs.getString("COLUMN_NAME")).thenReturn("(lower(`email`))");
        when(indexRs.getInt("NON_UNIQUE")).thenReturn(1);

        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(false);

        when(connection.prepareStatement(anyString())).thenReturn(indexStmt, triggerStmt);
        when(indexStmt.executeQuery()).thenReturn(indexRs);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);

        Entity entity = fill(connection, "t_user");
        List<Index> indexes = entity.getIndexs();
        assertEquals(1, indexes.size());
        assertEquals("idx_func_email", indexes.get(0).getName());
        assertEquals(List.of("(lower(`email`))"), indexes.get(0).getFields());
        assertTrue(indexes.get(0).getFields().get(0).contains("lower"));
    }

    @Test
    void loadIndexes_fallsBackToLegacySql_whenExpressionColumnMissing() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        stubColumns(meta, "reverse_demo", "t_user");

        PreparedStatement indexExprStmt = mock(PreparedStatement.class);
        when(indexExprStmt.executeQuery()).thenThrow(new SQLException("Unknown column 'EXPRESSION'"));

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

        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("EXPRESSION"))))
                .thenReturn(indexExprStmt);
        when(connection.prepareStatement(argThat(
                sql -> sql != null && sql.contains("STATISTICS") && !sql.contains("EXPRESSION"))))
                .thenReturn(indexLegacyStmt);
        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("TRIGGERS"))))
                .thenReturn(triggerStmt);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);

        Entity entity = fill(connection, "t_user");
        assertEquals(1, entity.getIndexs().size());
        assertEquals(List.of("email"), entity.getIndexs().get(0).getFields());
    }

    private static void stubColumns(DatabaseMetaData meta, String catalog, String table)
            throws SQLException {
        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(eq(catalog), isNull(), eq(table))).thenReturn(pkRs);

        ResultSet columnsRs = mock(ResultSet.class);
        when(columnsRs.next()).thenReturn(true, false);
        when(columnsRs.getString("COLUMN_NAME")).thenReturn("id");
        when(columnsRs.getString("REMARKS")).thenReturn(null);
        when(columnsRs.getString("TYPE_NAME")).thenReturn("BIGINT");
        when(columnsRs.getString("IS_NULLABLE")).thenReturn("NO");
        when(columnsRs.getString("COLUMN_DEF")).thenReturn(null);
        when(columnsRs.getString("IS_AUTOINCREMENT")).thenReturn("YES");
        when(columnsRs.getInt("DATA_TYPE")).thenReturn(Types.BIGINT);
        when(columnsRs.getInt("COLUMN_SIZE")).thenReturn(19);
        when(columnsRs.getInt("DECIMAL_DIGITS")).thenReturn(0);
        when(meta.getColumns(eq(catalog), isNull(), eq(table), eq("%"))).thenReturn(columnsRs);
    }

    private static Entity fill(Connection connection, String tableName) throws SQLException {
        TableIdentity table = new TableIdentity("reverse_demo", null, tableName, tableName, null);
        Entity entity = new Entity();
        new MysqlReverseDialect().fillEntity(connection, table, entity, new ParseDataModel(), "DEFAULT");
        return entity;
    }
}
