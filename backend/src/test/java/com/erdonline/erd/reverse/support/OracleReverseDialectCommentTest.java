package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.TableIdentity;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Oracle 注释字典回填：ALL_TAB_COMMENTS / ALL_COL_COMMENTS → chnname（无本机 Oracle 时用 mock JDBC）。
 */
class OracleReverseDialectCommentTest {

    @Test
    void capability_supportsComment() {
        assertTrue(new OracleReverseDialect().capability().isSupportsComment());
    }

    @Test
    void listTables_backfillsTableCommentFromDictionary() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);

        ResultSet tablesRs = mock(ResultSet.class);
        when(tablesRs.next()).thenReturn(true, false);
        when(tablesRs.getString("TABLE_CAT")).thenReturn(null);
        when(tablesRs.getString("TABLE_SCHEM")).thenReturn("DEMO");
        when(tablesRs.getString("TABLE_NAME")).thenReturn("T_USER");
        when(tablesRs.getString("REMARKS")).thenReturn(null);
        when(meta.getTables(isNull(), eq("DEMO"), eq("%"), eq(new String[]{"TABLE"})))
                .thenReturn(tablesRs);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(connection.prepareStatement(anyString())).thenReturn(commentStmt);
        when(commentStmt.executeQuery()).thenReturn(commentRs);
        when(commentRs.next()).thenReturn(true, false);
        when(commentRs.getString("TABLE_NAME")).thenReturn("T_USER");
        when(commentRs.getString("REMARKS")).thenReturn("用户表");

        List<TableIdentity> tables =
                new OracleReverseDialect().listTables(connection, "DEMO", "DEFAULT");
        assertEquals(1, tables.size());
        assertEquals("用户表", tables.get(0).getRemarks());
    }

    @Test
    void fillEntity_backfillsColumnCommentFromDictionary() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);

        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(isNull(), eq("DEMO"), eq("T_USER"))).thenReturn(pkRs);

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
        when(meta.getColumns(isNull(), eq("DEMO"), eq("T_USER"), eq("%"))).thenReturn(columnsRs);

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(false);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(true, false);
        when(commentRs.getString("COLUMN_NAME")).thenReturn("USER_ID");
        when(commentRs.getString("REMARKS")).thenReturn("用户ID");

        when(connection.prepareStatement(anyString())).thenReturn(indexStmt, commentStmt);
        when(indexStmt.executeQuery()).thenReturn(indexRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        TableIdentity table = new TableIdentity(null, "DEMO", "T_USER", "T_USER", "用户表");
        Entity entity = new Entity();
        ParseDataModel dataModel = new ParseDataModel();

        new OracleReverseDialect().fillEntity(connection, table, entity, dataModel, "DEFAULT");

        assertEquals("用户表", entity.getChnname());
        assertEquals(1, entity.getFields().size());
        Field field = entity.getFields().get(0);
        assertEquals("USER_ID", field.getName());
        assertEquals("用户ID", field.getChnname());
    }
}
