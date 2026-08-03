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
 * PostgreSQL 触发器字典：information_schema.triggers → entity.triggers（mock JDBC）。
 */
class PostgresqlReverseDialectTriggerTest {

    @Test
    void capability_supportsTrigger() {
        assertTrue(new PostgresqlReverseDialect().capability().isSupportsTrigger());
    }

    @Test
    void fillEntity_loadsTriggersFromDictionary() throws Exception {
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
        when(indexRs.next()).thenReturn(false);

        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(true, false);
        when(triggerRs.getString("TRIGGER_NAME")).thenReturn("trg_user_bu");
        when(triggerRs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(triggerRs.getString("EVENT_MANIPULATION")).thenReturn("UPDATE");
        when(triggerRs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(triggerRs.getString("ACTION_STATEMENT"))
                .thenReturn("EXECUTE FUNCTION set_updated_at()");

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

        List<Trigger> triggers = entity.getTriggers();
        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("trg_user_bu", trigger.getName());
        assertEquals("BEFORE", trigger.getTiming());
        assertEquals("UPDATE", trigger.getEvent());
        assertEquals("ROW", trigger.getOrientation());
        assertEquals("EXECUTE FUNCTION set_updated_at()", trigger.getStatement());
        assertTrue(trigger.getDdl().contains(
                "CREATE TRIGGER \"trg_user_bu\" BEFORE UPDATE ON \"t_user\" FOR EACH ROW"));
        assertTrue(trigger.getDdl().contains("EXECUTE FUNCTION set_updated_at()"));
    }
}
