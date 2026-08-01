package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Index;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 将 JDBC {@link DatabaseMetaData#getIndexInfo} 风格 ResultSet 映射为 {@link Index} 列表。
 * <p>约定列：TYPE / INDEX_NAME / COLUMN_NAME / NON_UNIQUE（与 JDBC 规范一致）。
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
            if (columnName == null) {
                continue;
            }
            boolean nonUnique = indexRs.getBoolean("NON_UNIQUE");
            String adjustedName = NameCaseAdjuster.adjust(indexName, nameCaseFlag);
            Index index = byName.computeIfAbsent(adjustedName, name -> new Index(name, !nonUnique));
            index.getFields().add(NameCaseAdjuster.adjust(columnName, nameCaseFlag));
        }
        return new ArrayList<>(byName.values());
    }

    /**
     * 映射字典表风格索引结果（MySQL STATISTICS / PostgreSQL pg_catalog 查询）。
     * <p>约定列名不区分大小写：INDEX_NAME / COLUMN_NAME / NON_UNIQUE（0=唯一）。
     * 调用方需已按索引名、序号 ORDER BY。
     */
    public static List<Index> mapFromStatistics(ResultSet statisticsRs, String nameCaseFlag) throws SQLException {
        Map<String, Index> byName = new LinkedHashMap<>(16);
        while (statisticsRs.next()) {
            String indexName = readStringIgnoreCase(statisticsRs, "INDEX_NAME");
            if (indexName == null || indexName.isEmpty()) {
                continue;
            }
            if (INDEX_PRIMARY.equalsIgnoreCase(indexName)) {
                continue;
            }
            String columnName = readStringIgnoreCase(statisticsRs, "COLUMN_NAME");
            if (columnName == null || columnName.isEmpty()) {
                continue;
            }
            // NON_UNIQUE: 0 唯一，1 非唯一
            int nonUniqueFlag = readIntIgnoreCase(statisticsRs, "NON_UNIQUE");
            boolean nonUnique = nonUniqueFlag != 0;
            String adjustedName = NameCaseAdjuster.adjust(indexName, nameCaseFlag);
            Index index = byName.computeIfAbsent(adjustedName, name -> new Index(name, !nonUnique));
            index.getFields().add(NameCaseAdjuster.adjust(columnName, nameCaseFlag));
        }
        return new ArrayList<>(byName.values());
    }

    private static String readStringIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getString(label);
        } catch (SQLException ignore) {
            return rs.getString(label.toLowerCase(java.util.Locale.ROOT));
        }
    }

    private static int readIntIgnoreCase(ResultSet rs, String label) throws SQLException {
        try {
            return rs.getInt(label);
        } catch (SQLException ignore) {
            return rs.getInt(label.toLowerCase(java.util.Locale.ROOT));
        }
    }
}
