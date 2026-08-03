package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Index;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * 将 JDBC {@link DatabaseMetaData#getIndexInfo} 风格 ResultSet 映射为 {@link Index} 列表。
 * <p>约定列：TYPE / INDEX_NAME / COLUMN_NAME / NON_UNIQUE（与 JDBC 规范一致）。
 * 字典层可另带 EXPRESSION（MySQL 8 函数索引）；表达式原样进 {@code fields[]}，不做大小写折叠。
 *
 * @author erdonline
 */
public final class IndexResultSetMapper {

    private static final String INDEX_PRIMARY = "PRIMARY";

    private IndexResultSetMapper() {
    }

    /**
     * 聚合索引行：跳过统计行与 PRIMARY；按 INDEX_NAME 分组保持列序。
     */
    public static List<Index> mapFromJdbcIndexInfo(ResultSet indexRs, String nameCaseFlag) throws SQLException {
        Map<String, Index> byName = new LinkedHashMap<>(16);
        while (indexRs.next()) {
            short type = indexRs.getShort("TYPE");
            if (type == DatabaseMetaData.tableIndexStatistic) {
                continue;
            }
            String indexName = indexRs.getString("INDEX_NAME");
            if (indexName == null || indexName.isEmpty()) {
                continue;
            }
            if (INDEX_PRIMARY.equalsIgnoreCase(indexName)) {
                continue;
            }
            String columnName = indexRs.getString("COLUMN_NAME");
            if (columnName == null || columnName.isEmpty()) {
                // JDBC 常把函数键写成 null；无表达式旁路时软跳过该键位
                continue;
            }
            boolean nonUnique = indexRs.getBoolean("NON_UNIQUE");
            String adjustedName = NameCaseAdjuster.adjust(indexName, nameCaseFlag);
            Index index = byName.computeIfAbsent(adjustedName, name -> new Index(name, !nonUnique));
            index.getFields().add(adjustIndexField(columnName, nameCaseFlag));
        }
        return new ArrayList<>(byName.values());
    }

    /**
     * 映射字典表风格索引结果（MySQL STATISTICS / PostgreSQL pg_catalog /
     * Oracle ALL_IND_* / SQL Server sys.indexes 查询）。
     * <p>约定列名不区分大小写：INDEX_NAME / COLUMN_NAME / NON_UNIQUE（0=唯一）；
     * 可选 EXPRESSION（有值则优先，覆盖 Oracle SYS_NC$ / SQL Server 计算列）。
     * Oracle {@code COLUMN_EXPRESSION} 为 LONG：每行须在其它列之前读取 EXPRESSION。
     * 调用方需已按索引名、序号 ORDER BY。
     */
    public static List<Index> mapFromStatistics(ResultSet statisticsRs, String nameCaseFlag) throws SQLException {
        Map<String, Index> byName = new LinkedHashMap<>(16);
        while (statisticsRs.next()) {
            // Oracle LONG：next() 后立刻读 EXPRESSION，再读其它列
            String keyPart = readIndexKeyPart(statisticsRs);
            String indexName = readStringIgnoreCase(statisticsRs, "INDEX_NAME");
            if (indexName == null || indexName.isEmpty()) {
                continue;
            }
            if (INDEX_PRIMARY.equalsIgnoreCase(indexName)) {
                continue;
            }
            if (keyPart == null || keyPart.isEmpty()) {
                continue;
            }
            // NON_UNIQUE: 0 唯一，1 非唯一
            int nonUniqueFlag = readIntIgnoreCase(statisticsRs, "NON_UNIQUE");
            boolean nonUnique = nonUniqueFlag != 0;
            String adjustedName = NameCaseAdjuster.adjust(indexName, nameCaseFlag);
            Index index = byName.computeIfAbsent(adjustedName, name -> new Index(name, !nonUnique));
            index.getFields().add(adjustIndexField(keyPart, nameCaseFlag));
        }
        return new ArrayList<>(byName.values());
    }

    /**
     * 键位：优先 EXPRESSION（Oracle 函数索引 / SQL Server 计算列 / MySQL 8）；
     * 空则 COLUMN_NAME。须在读其它列之前调用（Oracle LONG）。
     */
    static String readIndexKeyPart(ResultSet rs) throws SQLException {
        String expression = readOptionalStringIgnoreCase(rs, "EXPRESSION");
        if (expression != null && !expression.isEmpty()) {
            return expression;
        }
        return readOptionalStringIgnoreCase(rs, "COLUMN_NAME");
    }

    /**
     * 纯列名走大小写策略；含括号/引号/空白等视为表达式，原样保留。
     */
    static String adjustIndexField(String field, String nameCaseFlag) {
        if (field == null) {
            return null;
        }
        if (looksLikeIndexExpression(field)) {
            return field;
        }
        return NameCaseAdjuster.adjust(field, nameCaseFlag);
    }

    static boolean looksLikeIndexExpression(String field) {
        for (int i = 0; i < field.length(); i++) {
            char c = field.charAt(i);
            if (c == '(' || c == ')' || c == ' ' || c == '\'' || c == '"' || c == '`' || c == ':') {
                return true;
            }
        }
        return false;
    }

    private static String readStringIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getString(label);
        } catch (SQLException ignore) {
            return rs.getString(label.toLowerCase(Locale.ROOT));
        }
    }

    private static String readOptionalStringIgnoreCase(ResultSet rs, String label) {
        try {
            return readStringIgnoreCase(rs, label);
        } catch (SQLException ignore) {
            return null;
        }
    }

    private static int readIntIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getInt(label);
        } catch (SQLException ignore) {
            return rs.getInt(label.toLowerCase(Locale.ROOT));
        }
    }
}
