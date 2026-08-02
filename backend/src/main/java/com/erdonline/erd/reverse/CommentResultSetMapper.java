package com.erdonline.erd.reverse;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 将字典注释 ResultSet 映射为表名/列名 → remarks。
 * <p>约定列：TABLE_NAME / COLUMN_NAME / REMARKS（大小写不敏感）。
 *
 * @author erdonline
 */
public final class CommentResultSetMapper {

    private CommentResultSetMapper() {
    }

    /**
     * 表注释：TABLE_NAME → REMARKS（跳过空注释）。
     */
    public static Map<String, String> mapTableComments(ResultSet rs) throws SQLException {
        Map<String, String> byTable = new LinkedHashMap<>(16);
        while (rs.next()) {
            String tableName = readStringIgnoreCase(rs, "TABLE_NAME");
            String remarks = readStringIgnoreCase(rs, "REMARKS");
            if (tableName == null || tableName.isEmpty() || isBlank(remarks)) {
                continue;
            }
            byTable.put(tableName, remarks);
        }
        return byTable;
    }

    /**
     * 列注释：COLUMN_NAME（经 nameCase）→ REMARKS（跳过空注释）。
     */
    public static Map<String, String> mapColumnComments(ResultSet rs, String nameCaseFlag)
            throws SQLException {
        Map<String, String> byColumn = new LinkedHashMap<>(32);
        while (rs.next()) {
            String columnName = readStringIgnoreCase(rs, "COLUMN_NAME");
            String remarks = readStringIgnoreCase(rs, "REMARKS");
            if (columnName == null || columnName.isEmpty() || isBlank(remarks)) {
                continue;
            }
            byColumn.put(NameCaseAdjuster.adjust(columnName, nameCaseFlag), remarks);
        }
        return byColumn;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isEmpty();
    }

    private static String readStringIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getString(label);
        } catch (SQLException ignore) {
            return rs.getString(label.toLowerCase(Locale.ROOT));
        }
    }
}
