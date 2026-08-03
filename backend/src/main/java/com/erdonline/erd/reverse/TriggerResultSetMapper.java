package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Trigger;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;

/**
 * 将字典风格触发器 ResultSet 映射为 {@link Trigger} 列表，并重建 DDL。
 * <p>约定列（大小写不敏感）：TRIGGER_NAME / ACTION_TIMING / EVENT_MANIPULATION /
 * ACTION_ORIENTATION / ACTION_STATEMENT（MySQL {@code INFORMATION_SCHEMA.TRIGGERS} /
 * PostgreSQL {@code information_schema.triggers} / SQL Server {@code sys.triggers} /
 * Oracle {@code ALL_TRIGGERS}/{@code ALL_SOURCE} 投影）。
 *
 * @author erdonline
 */
public final class TriggerResultSetMapper {

    private TriggerResultSetMapper() {
    }

    /**
     * MySQL/MariaDB：重建反引号 CREATE TRIGGER。
     *
     * @param tableDisplayName 用于 DDL 中的 ON 表名（已按 nameCase 调整的显示名）
     */
    public static List<Trigger> mapFromInformationSchema(ResultSet rs, String tableDisplayName,
                                                         String nameCaseFlag) throws SQLException {
        return mapDictionaryRows(rs, tableDisplayName, nameCaseFlag, TriggerResultSetMapper::buildMysqlDdl);
    }

    /**
     * PostgreSQL：重建双引号 CREATE TRIGGER（statement 多为 EXECUTE FUNCTION/PROCEDURE）。
     */
    public static List<Trigger> mapFromPostgresInformationSchema(ResultSet rs, String tableDisplayName,
                                                                 String nameCaseFlag) throws SQLException {
        return mapDictionaryRows(rs, tableDisplayName, nameCaseFlag, TriggerResultSetMapper::buildPostgresDdl);
    }

    /**
     * SQL Server：sys.triggers 投影；若 ACTION_STATEMENT 已是完整 CREATE TRIGGER（OBJECT_DEFINITION）则直接作 ddl，
     * 否则按方括号重建。
     */
    public static List<Trigger> mapFromSqlServerSys(ResultSet rs, String tableDisplayName,
                                                    String nameCaseFlag) throws SQLException {
        return mapDictionaryRows(rs, tableDisplayName, nameCaseFlag, TriggerResultSetMapper::resolveSqlServerDdl);
    }

    /**
     * Oracle：ALL_TRIGGERS + ALL_SOURCE 投影；完整 CREATE / TRIGGER 源码原样作 ddl，否则双引号重建。
     */
    public static List<Trigger> mapFromOracleAllTriggers(ResultSet rs, String tableDisplayName,
                                                         String nameCaseFlag) throws SQLException {
        return mapDictionaryRows(rs, tableDisplayName, nameCaseFlag, TriggerResultSetMapper::resolveOracleDdl);
    }

    private static List<Trigger> mapDictionaryRows(ResultSet rs, String tableDisplayName, String nameCaseFlag,
                                                   DdlBuilder ddlBuilder) throws SQLException {
        List<Trigger> triggers = new ArrayList<>(4);
        while (rs.next()) {
            String rawName = readStringIgnoreCase(rs, "TRIGGER_NAME");
            if (rawName == null || rawName.isEmpty()) {
                continue;
            }
            String timing = upperOrNull(readStringIgnoreCase(rs, "ACTION_TIMING"));
            String event = upperOrNull(readStringIgnoreCase(rs, "EVENT_MANIPULATION"));
            String orientation = upperOrNull(readStringIgnoreCase(rs, "ACTION_ORIENTATION"));
            String statement = readStringIgnoreCase(rs, "ACTION_STATEMENT");
            if (statement == null) {
                statement = "";
            }

            Trigger trigger = new Trigger();
            trigger.setName(NameCaseAdjuster.adjust(rawName, nameCaseFlag));
            trigger.setTiming(timing);
            trigger.setEvent(event);
            trigger.setOrientation(orientation != null ? orientation : "ROW");
            trigger.setStatement(statement);
            trigger.setDdl(ddlBuilder.build(
                    trigger.getName(),
                    timing,
                    event,
                    trigger.getOrientation(),
                    statement,
                    tableDisplayName));
            triggers.add(trigger);
        }
        return triggers;
    }

    /**
     * 重建 MySQL 风格 CREATE TRIGGER（保真名+时机+事件+体；非字节级 SHOW CREATE 克隆）。
     */
    public static String buildMysqlDdl(String name, String timing, String event, String orientation,
                                       String statement, String tableName) {
        String safeName = name == null ? "" : name;
        String safeTable = tableName == null ? "" : tableName;
        String safeTiming = timing == null ? "BEFORE" : timing;
        String safeEvent = event == null ? "INSERT" : event;
        String safeOrient = orientation == null || orientation.isEmpty() ? "ROW" : orientation;
        String body = statement == null ? "" : statement;
        return "CREATE TRIGGER `" + quoteMysqlIdent(safeName) + "` "
                + safeTiming + " " + safeEvent
                + " ON `" + quoteMysqlIdent(safeTable) + "` FOR EACH " + safeOrient
                + "\n" + body;
    }

    /**
     * 重建 PostgreSQL 风格 CREATE TRIGGER（保真字典字段；非 pg_get_triggerdef 字节克隆）。
     */
    public static String buildPostgresDdl(String name, String timing, String event, String orientation,
                                          String statement, String tableName) {
        String safeName = name == null ? "" : name;
        String safeTable = tableName == null ? "" : tableName;
        String safeTiming = timing == null ? "BEFORE" : timing;
        String safeEvent = event == null ? "INSERT" : event;
        String safeOrient = orientation == null || orientation.isEmpty() ? "ROW" : orientation;
        String body = statement == null ? "" : statement;
        return "CREATE TRIGGER \"" + quotePostgresIdent(safeName) + "\" "
                + safeTiming + " " + safeEvent
                + " ON \"" + quotePostgresIdent(safeTable) + "\" FOR EACH " + safeOrient
                + "\n" + body;
    }

    /**
     * 重建 SQL Server 风格 CREATE TRIGGER（方括号标识符；多事件拆行时按单事件重建）。
     */
    public static String buildSqlServerDdl(String name, String timing, String event, String orientation,
                                           String statement, String tableName) {
        String safeName = name == null ? "" : name;
        String safeTable = tableName == null ? "" : tableName;
        String safeTiming = timing == null ? "AFTER" : timing;
        String safeEvent = event == null ? "INSERT" : event;
        String body = statement == null ? "" : statement;
        return "CREATE TRIGGER [" + quoteSqlServerIdent(safeName) + "] "
                + "ON [" + quoteSqlServerIdent(safeTable) + "] "
                + safeTiming + " " + safeEvent
                + "\nAS\n" + body;
    }

    static String resolveSqlServerDdl(String name, String timing, String event, String orientation,
                                      String statement, String tableName) {
        if (statement != null) {
            String trimmed = statement.trim();
            if (!trimmed.isEmpty() && startsWithIgnoreCase(trimmed, "CREATE ")) {
                return trimmed;
            }
        }
        return buildSqlServerDdl(name, timing, event, orientation, statement, tableName);
    }

    /**
     * 重建 Oracle 风格 CREATE OR REPLACE TRIGGER（双引号标识符；多事件拆行时按单事件重建）。
     */
    public static String buildOracleDdl(String name, String timing, String event, String orientation,
                                        String statement, String tableName) {
        String safeName = name == null ? "" : name;
        String safeTable = tableName == null ? "" : tableName;
        String safeTiming = timing == null ? "BEFORE" : timing;
        String safeEvent = event == null ? "INSERT" : event;
        String safeOrient = orientation == null || orientation.isEmpty() ? "ROW" : orientation;
        String body = statement == null ? "" : statement;
        return "CREATE OR REPLACE TRIGGER \"" + quoteOracleIdent(safeName) + "\" "
                + safeTiming + " " + safeEvent
                + " ON \"" + quoteOracleIdent(safeTable) + "\" FOR EACH " + safeOrient
                + "\n" + body;
    }

    static String resolveOracleDdl(String name, String timing, String event, String orientation,
                                   String statement, String tableName) {
        if (statement != null) {
            String trimmed = statement.trim();
            if (!trimmed.isEmpty()) {
                if (startsWithIgnoreCase(trimmed, "CREATE ")) {
                    return trimmed;
                }
                if (startsWithIgnoreCase(trimmed, "TRIGGER ")) {
                    return "CREATE OR REPLACE " + trimmed;
                }
            }
        }
        return buildOracleDdl(name, timing, event, orientation, statement, tableName);
    }

    private static String quoteMysqlIdent(String ident) {
        return ident.replace("`", "``");
    }

    private static String quotePostgresIdent(String ident) {
        return ident.replace("\"", "\"\"");
    }

    private static String quoteSqlServerIdent(String ident) {
        return ident.replace("]", "]]");
    }

    private static String quoteOracleIdent(String ident) {
        return ident.replace("\"", "\"\"");
    }

    private static boolean startsWithIgnoreCase(String value, String prefix) {
        return value.regionMatches(true, 0, prefix, 0, prefix.length());
    }

    private static String upperOrNull(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        return value.toUpperCase(Locale.ROOT);
    }

    private static String readStringIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getString(label);
        } catch (SQLException ignore) {
            return rs.getString(label.toLowerCase(Locale.ROOT));
        }
    }

    @FunctionalInterface
    private interface DdlBuilder {
        String build(String name, String timing, String event, String orientation,
                     String statement, String tableName);
    }
}
