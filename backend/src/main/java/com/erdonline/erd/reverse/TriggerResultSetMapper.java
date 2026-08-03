package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Trigger;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * 将字典风格触发器 ResultSet 映射为 {@link Trigger} 列表，并重建 DDL。
 * <p>约定列（大小写不敏感）：TRIGGER_NAME / ACTION_TIMING / EVENT_MANIPULATION /
 * ACTION_ORIENTATION / ACTION_STATEMENT（MySQL {@code INFORMATION_SCHEMA.TRIGGERS}）。
 *
 * @author erdonline
 */
public final class TriggerResultSetMapper {

    private TriggerResultSetMapper() {
    }

    /**
     * @param tableDisplayName 用于 DDL 中的 ON 表名（已按 nameCase 调整的显示名）
     */
    public static List<Trigger> mapFromInformationSchema(ResultSet rs, String tableDisplayName,
                                                         String nameCaseFlag) throws SQLException {
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
            trigger.setDdl(buildMysqlDdl(
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
        return "CREATE TRIGGER `" + quoteIdent(safeName) + "` "
                + safeTiming + " " + safeEvent
                + " ON `" + quoteIdent(safeTable) + "` FOR EACH " + safeOrient
                + "\n" + body;
    }

    private static String quoteIdent(String ident) {
        return ident.replace("`", "``");
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
}
