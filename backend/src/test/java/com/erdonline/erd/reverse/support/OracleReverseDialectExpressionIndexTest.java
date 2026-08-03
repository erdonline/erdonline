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
 * Oracle 函数索引：ALL_IND_EXPRESSIONS → indexs[].fields[]（mock JDBC）；无视图回退。
 */
class OracleReverseDialectExpressionIndexTest {

    @Test
    void fillEntity_mapsFunctionalIndexExpression_overSysNc() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);

        stubColumns(meta, "DEMO", "T_USER");

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(true, true, false);
        // LONG first：EXPRESSION → INDEX_NAME → COLUMN_NAME
        when(indexRs.getString("EXPRESSION")).thenReturn(null, "LOWER(\"EMAIL\")");
        when(indexRs.getString("expression")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getString("INDEX_NAME")).thenReturn("IDX_USER_EMAIL_LOWER", "IDX_USER_EMAIL_LOWER");
        when(indexRs.getString("index_name")).thenThrow(new SQLException("uppercase only"));
        when(indexRs.getString("COLUMN_NAME")).thenReturn("TENANT_ID", "SYS_NC00005$");
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
        assertEquals("IDX_USER_EMAIL_LOWER", indexes.get(0).getName());
        assertEquals(List.of("TENANT_ID", "LOWER(\"EMAIL\")"), indexes.get(0).getFields());
        assertTrue(indexes.get(0).getFields().get(1).contains("LOWER"));
    }

    @Test
    void loadIndexes_fallsBackToLegacySql_whenIndExpressionsUnavailable() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);

        stubColumns(meta, "DEMO", "T_USER");

        PreparedStatement indexExprStmt = mock(PreparedStatement.class);
        when(indexExprStmt.executeQuery())
                .thenThrow(new SQLException("ORA-00942: table or view does not exist"));

        PreparedStatement indexLegacyStmt = mock(PreparedStatement.class);
        ResultSet legacyRs = mock(ResultSet.class);
        when(legacyRs.next()).thenReturn(true, false);
        when(legacyRs.getString("INDEX_NAME")).thenReturn("IDX_EMAIL");
        when(legacyRs.getString("COLUMN_NAME")).thenReturn("EMAIL");
        when(legacyRs.getInt("NON_UNIQUE")).thenReturn(1);
        when(indexLegacyStmt.executeQuery()).thenReturn(legacyRs);

        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(false);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(false);

        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("all_ind_expressions"))))
                .thenReturn(indexExprStmt);
        when(connection.prepareStatement(argThat(
                sql -> sql != null && sql.contains("all_ind_columns")
                        && !sql.contains("all_ind_expressions"))))
                .thenReturn(indexLegacyStmt);
        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("all_triggers"))))
                .thenReturn(triggerStmt);
        when(connection.prepareStatement(argThat(sql -> sql != null && sql.contains("all_col_comments"))))
                .thenReturn(commentStmt);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        Entity entity = fill(connection);
        assertEquals(1, entity.getIndexs().size());
        assertEquals(List.of("EMAIL"), entity.getIndexs().get(0).getFields());
    }

    private static void stubColumns(DatabaseMetaData meta, String schema, String table)
            throws SQLException {
        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(isNull(), eq(schema), eq(table))).thenReturn(pkRs);

        ResultSet columnsRs = mock(ResultSet.class);
        when(columnsRs.next()).thenReturn(true, false);
        when(columnsRs.getString("COLUMN_NAME")).thenReturn("USER_ID");
        when(columnsRs.getString("REMARKS")).thenReturn(null);
        when(columnsRs.getString("TYPE_NAME")).thenReturn("NUMBER");
        when(columnsRs.getString("IS_NULLABLE")).thenReturn("NO");
        when(columnsRs.getString("COLUMN_DEF")).thenReturn(null);
        when(columnsRs.getInt("DATA_TYPE")).thenReturn(Types.NUMERIC);
        when(columnsRs.getInt("COLUMN_SIZE")).thenReturn(19);
        when(columnsRs.getInt("DECIMAL_DIGITS")).thenReturn(0);
        when(meta.getColumns(isNull(), eq(schema), eq(table), eq("%"))).thenReturn(columnsRs);
    }

    private static Entity fill(Connection connection) throws SQLException {
        TableIdentity table = new TableIdentity(null, "DEMO", "T_USER", "T_USER", null);
        Entity entity = new Entity();
        new OracleReverseDialect().fillEntity(connection, table, entity, new ParseDataModel(), "DEFAULT");
        return entity;
    }
}
