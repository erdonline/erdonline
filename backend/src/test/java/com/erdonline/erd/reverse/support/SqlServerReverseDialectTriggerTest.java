package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.model.Trigger;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * SQL Server 触发器字典：sys.triggers → entity.triggers（mock JDBC）。
 */
class SqlServerReverseDialectTriggerTest {

    @Test
    void capability_supportsTrigger() {
        assertTrue(new SqlServerReverseDialect().capability().isSupportsTrigger());
    }

    @Test
    void fillEntity_loadsTriggersFromDictionary() throws Exception {
        Connection connection = mock(Connection.class);
        DatabaseMetaData meta = mock(DatabaseMetaData.class);
        when(connection.getMetaData()).thenReturn(meta);
        when(connection.getCatalog()).thenReturn("reverse_demo");

        ResultSet pkRs = mock(ResultSet.class);
        when(pkRs.next()).thenReturn(false);
        when(meta.getPrimaryKeys(eq("reverse_demo"), eq("dbo"), eq("t_user"))).thenReturn(pkRs);

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
        when(meta.getColumns(eq("reverse_demo"), eq("dbo"), eq("t_user"), eq("%")))
                .thenReturn(columnsRs);

        PreparedStatement indexStmt = mock(PreparedStatement.class);
        ResultSet indexRs = mock(ResultSet.class);
        when(indexRs.next()).thenReturn(false);

        String objectDef = "CREATE TRIGGER [trg_user_ai] ON [dbo].[t_user] AFTER INSERT\n"
                + "AS\nBEGIN SET NOCOUNT ON; END";
        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(true, false);
        when(triggerRs.getString("TRIGGER_NAME")).thenReturn("trg_user_ai");
        when(triggerRs.getString("ACTION_TIMING")).thenReturn("AFTER");
        when(triggerRs.getString("EVENT_MANIPULATION")).thenReturn("INSERT");
        when(triggerRs.getString("ACTION_ORIENTATION")).thenReturn("STATEMENT");
        when(triggerRs.getString("ACTION_STATEMENT")).thenReturn(objectDef);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(false);

        when(connection.prepareStatement(anyString())).thenReturn(indexStmt, triggerStmt, commentStmt);
        when(indexStmt.executeQuery()).thenReturn(indexRs);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        TableIdentity table = new TableIdentity("reverse_demo", "dbo", "t_user", "t_user", null);
        Entity entity = new Entity();
        ParseDataModel dataModel = new ParseDataModel();

        new SqlServerReverseDialect().fillEntity(connection, table, entity, dataModel, "DEFAULT");

        List<Trigger> triggers = entity.getTriggers();
        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("trg_user_ai", trigger.getName());
        assertEquals("AFTER", trigger.getTiming());
        assertEquals("INSERT", trigger.getEvent());
        assertEquals("STATEMENT", trigger.getOrientation());
        assertEquals(objectDef, trigger.getStatement());
        assertEquals(objectDef, trigger.getDdl());
    }
}
