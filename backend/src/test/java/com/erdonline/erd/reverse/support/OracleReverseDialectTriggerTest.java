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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Oracle 触发器字典：ALL_TRIGGERS + ALL_SOURCE → entity.triggers（mock JDBC）。
 */
class OracleReverseDialectTriggerTest {

    @Test
    void capability_supportsTrigger() {
        assertTrue(new OracleReverseDialect().capability().isSupportsTrigger());
    }

    @Test
    void fillEntity_loadsTriggersFromDictionary() throws Exception {
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

        String source = "CREATE OR REPLACE TRIGGER \"TRG_USER_BI\" BEFORE INSERT ON \"T_USER\" "
                + "FOR EACH ROW\nBEGIN :NEW.CREATED_AT := SYSDATE; END;";
        PreparedStatement triggerStmt = mock(PreparedStatement.class);
        ResultSet triggerRs = mock(ResultSet.class);
        when(triggerRs.next()).thenReturn(true, false);
        when(triggerRs.getString("TRIGGER_NAME")).thenReturn("TRG_USER_BI");
        when(triggerRs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(triggerRs.getString("EVENT_MANIPULATION")).thenReturn("INSERT");
        when(triggerRs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(triggerRs.getString("ACTION_STATEMENT")).thenReturn(source);

        PreparedStatement commentStmt = mock(PreparedStatement.class);
        ResultSet commentRs = mock(ResultSet.class);
        when(commentRs.next()).thenReturn(false);

        when(connection.prepareStatement(anyString())).thenReturn(indexStmt, triggerStmt, commentStmt);
        when(indexStmt.executeQuery()).thenReturn(indexRs);
        when(triggerStmt.executeQuery()).thenReturn(triggerRs);
        when(commentStmt.executeQuery()).thenReturn(commentRs);

        TableIdentity table = new TableIdentity(null, "DEMO", "T_USER", "T_USER", null);
        Entity entity = new Entity();
        ParseDataModel dataModel = new ParseDataModel();

        new OracleReverseDialect().fillEntity(connection, table, entity, dataModel, "DEFAULT");

        List<Trigger> triggers = entity.getTriggers();
        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("TRG_USER_BI", trigger.getName());
        assertEquals("BEFORE", trigger.getTiming());
        assertEquals("INSERT", trigger.getEvent());
        assertEquals("ROW", trigger.getOrientation());
        assertEquals(source, trigger.getStatement());
        assertEquals(source, trigger.getDdl());
    }
}
