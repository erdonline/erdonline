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
