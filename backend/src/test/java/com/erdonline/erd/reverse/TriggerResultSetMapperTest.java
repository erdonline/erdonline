package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Trigger;
import org.junit.jupiter.api.Test;

import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * INFORMATION_SCHEMA / information_schema.triggers → Trigger（含 DDL 重建）。
 */
class TriggerResultSetMapperTest {

    @Test
    void mapFromInformationSchema_buildsNameTimingEventAndDdl() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("trg_user_bi");
        when(rs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("INSERT");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(rs.getString("ACTION_STATEMENT")).thenReturn("SET NEW.created_at = NOW()");

        List<Trigger> triggers =
                TriggerResultSetMapper.mapFromInformationSchema(rs, "t_user", "DEFAULT");

        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("trg_user_bi", trigger.getName());
        assertEquals("BEFORE", trigger.getTiming());
        assertEquals("INSERT", trigger.getEvent());
        assertEquals("ROW", trigger.getOrientation());
        assertEquals("SET NEW.created_at = NOW()", trigger.getStatement());
        assertTrue(trigger.getDdl().startsWith(
                "CREATE TRIGGER `trg_user_bi` BEFORE INSERT ON `t_user` FOR EACH ROW"));
        assertTrue(trigger.getDdl().contains("SET NEW.created_at = NOW()"));
    }

    @Test
    void mapFromPostgresInformationSchema_buildsDoubleQuotedDdl() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("trg_user_bu");
        when(rs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("UPDATE");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(rs.getString("ACTION_STATEMENT")).thenReturn("EXECUTE FUNCTION set_updated_at()");

        List<Trigger> triggers =
                TriggerResultSetMapper.mapFromPostgresInformationSchema(rs, "t_user", "DEFAULT");

        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("trg_user_bu", trigger.getName());
        assertEquals("BEFORE", trigger.getTiming());
        assertEquals("UPDATE", trigger.getEvent());
        assertEquals("EXECUTE FUNCTION set_updated_at()", trigger.getStatement());
        assertTrue(trigger.getDdl().startsWith(
                "CREATE TRIGGER \"trg_user_bu\" BEFORE UPDATE ON \"t_user\" FOR EACH ROW"));
        assertTrue(trigger.getDdl().contains("EXECUTE FUNCTION set_updated_at()"));
    }

    @Test
    void buildMysqlDdl_escapesBackticksInIdentifiers() {
        String ddl = TriggerResultSetMapper.buildMysqlDdl(
                "a`b", "AFTER", "UPDATE", "ROW", "BEGIN END", "t`bl");
        assertEquals(
                "CREATE TRIGGER `a``b` AFTER UPDATE ON `t``bl` FOR EACH ROW\nBEGIN END",
                ddl);
    }

    @Test
    void buildPostgresDdl_escapesDoubleQuotesInIdentifiers() {
        String ddl = TriggerResultSetMapper.buildPostgresDdl(
                "a\"b", "AFTER", "DELETE", "STATEMENT", "EXECUTE FUNCTION f()", "t\"bl");
        assertEquals(
                "CREATE TRIGGER \"a\"\"b\" AFTER DELETE ON \"t\"\"bl\" FOR EACH STATEMENT\nEXECUTE FUNCTION f()",
                ddl);
    }

    @Test
    void mapFromSqlServerSys_prefersObjectDefinitionAsDdl() throws Exception {
        String objectDef = "CREATE TRIGGER [trg_user_ai] ON [dbo].[t_user] AFTER INSERT\nAS\nBEGIN END";
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("trg_user_ai");
        when(rs.getString("ACTION_TIMING")).thenReturn("AFTER");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("INSERT");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("STATEMENT");
        when(rs.getString("ACTION_STATEMENT")).thenReturn(objectDef);

        List<Trigger> triggers =
                TriggerResultSetMapper.mapFromSqlServerSys(rs, "t_user", "DEFAULT");

        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("trg_user_ai", trigger.getName());
        assertEquals("AFTER", trigger.getTiming());
        assertEquals("INSERT", trigger.getEvent());
        assertEquals("STATEMENT", trigger.getOrientation());
        assertEquals(objectDef, trigger.getStatement());
        assertEquals(objectDef, trigger.getDdl());
    }

    @Test
    void mapFromSqlServerSys_rebuildsBracketDdlWhenBodyOnly() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("trg_user_ad");
        when(rs.getString("ACTION_TIMING")).thenReturn("INSTEAD OF");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("DELETE");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("STATEMENT");
        when(rs.getString("ACTION_STATEMENT")).thenReturn("BEGIN SET NOCOUNT ON; END");

        List<Trigger> triggers =
                TriggerResultSetMapper.mapFromSqlServerSys(rs, "t_user", "DEFAULT");

        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("INSTEAD OF", trigger.getTiming());
        assertEquals("DELETE", trigger.getEvent());
        assertEquals(
                "CREATE TRIGGER [trg_user_ad] ON [t_user] INSTEAD OF DELETE\nAS\nBEGIN SET NOCOUNT ON; END",
                trigger.getDdl());
    }

    @Test
    void buildSqlServerDdl_escapesClosingBracketsInIdentifiers() {
        String ddl = TriggerResultSetMapper.buildSqlServerDdl(
                "a]b", "AFTER", "UPDATE", "STATEMENT", "BEGIN END", "t]bl");
        assertEquals(
                "CREATE TRIGGER [a]]b] ON [t]]bl] AFTER UPDATE\nAS\nBEGIN END",
                ddl);
    }

    @Test
    void mapFromOracleAllTriggers_prefersCreateSourceAsDdl() throws Exception {
        String source = "CREATE OR REPLACE TRIGGER \"TRG_USER_BI\" BEFORE INSERT ON \"T_USER\" "
                + "FOR EACH ROW\nBEGIN NULL; END;";
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("TRG_USER_BI");
        when(rs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("INSERT");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(rs.getString("ACTION_STATEMENT")).thenReturn(source);

        List<Trigger> triggers =
                TriggerResultSetMapper.mapFromOracleAllTriggers(rs, "T_USER", "DEFAULT");

        assertEquals(1, triggers.size());
        Trigger trigger = triggers.get(0);
        assertEquals("TRG_USER_BI", trigger.getName());
        assertEquals("BEFORE", trigger.getTiming());
        assertEquals("INSERT", trigger.getEvent());
        assertEquals("ROW", trigger.getOrientation());
        assertEquals(source, trigger.getStatement());
        assertEquals(source, trigger.getDdl());
    }

    @Test
    void mapFromOracleAllTriggers_prefixesTriggerSourceAndRebuildsBodyOnly() throws Exception {
        ResultSet withTriggerKw = mock(ResultSet.class);
        when(withTriggerKw.next()).thenReturn(true, false);
        when(withTriggerKw.getString("TRIGGER_NAME")).thenReturn("TRG_A");
        when(withTriggerKw.getString("ACTION_TIMING")).thenReturn("AFTER");
        when(withTriggerKw.getString("EVENT_MANIPULATION")).thenReturn("UPDATE");
        when(withTriggerKw.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(withTriggerKw.getString("ACTION_STATEMENT"))
                .thenReturn("TRIGGER TRG_A AFTER UPDATE ON T_USER FOR EACH ROW\nBEGIN NULL; END;");

        Trigger prefixed = TriggerResultSetMapper
                .mapFromOracleAllTriggers(withTriggerKw, "T_USER", "DEFAULT").get(0);
        assertTrue(prefixed.getDdl().startsWith("CREATE OR REPLACE TRIGGER TRG_A"));

        ResultSet bodyOnly = mock(ResultSet.class);
        when(bodyOnly.next()).thenReturn(true, false);
        when(bodyOnly.getString("TRIGGER_NAME")).thenReturn("TRG_B");
        when(bodyOnly.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(bodyOnly.getString("EVENT_MANIPULATION")).thenReturn("DELETE");
        when(bodyOnly.getString("ACTION_ORIENTATION")).thenReturn("STATEMENT");
        when(bodyOnly.getString("ACTION_STATEMENT")).thenReturn("BEGIN NULL; END;");

        Trigger rebuilt = TriggerResultSetMapper
                .mapFromOracleAllTriggers(bodyOnly, "T_USER", "DEFAULT").get(0);
        assertEquals(
                "CREATE OR REPLACE TRIGGER \"TRG_B\" BEFORE DELETE ON \"T_USER\" "
                        + "FOR EACH STATEMENT\nBEGIN NULL; END;",
                rebuilt.getDdl());
    }

    @Test
    void buildOracleDdl_escapesDoubleQuotesInIdentifiers() {
        String ddl = TriggerResultSetMapper.buildOracleDdl(
                "a\"b", "AFTER", "INSERT", "ROW", "BEGIN NULL; END;", "t\"bl");
        assertEquals(
                "CREATE OR REPLACE TRIGGER \"a\"\"b\" AFTER INSERT ON \"t\"\"bl\" "
                        + "FOR EACH ROW\nBEGIN NULL; END;",
                ddl);
    }

    @Test
    void mapFromInformationSchema_skipsBlankName() throws Exception {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, false);
        when(rs.getString("TRIGGER_NAME")).thenReturn("");
        when(rs.getString("ACTION_TIMING")).thenReturn("BEFORE");
        when(rs.getString("EVENT_MANIPULATION")).thenReturn("DELETE");
        when(rs.getString("ACTION_ORIENTATION")).thenReturn("ROW");
        when(rs.getString("ACTION_STATEMENT")).thenReturn("SIGNAL SQLSTATE '45000'");

        assertTrue(TriggerResultSetMapper.mapFromInformationSchema(rs, "t_user", "DEFAULT").isEmpty());
    }
}
