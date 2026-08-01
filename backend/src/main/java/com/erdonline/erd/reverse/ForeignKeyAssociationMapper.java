package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.AssociationEnd;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 将外键 ResultSet 映射为 {@link Association}。
 * <p>JDBC：{@code getImportedKeys} 列 FKTABLE_NAME / FKCOLUMN_NAME / PKTABLE_NAME / PKCOLUMN_NAME。
 * <p>字典：INFORMATION_SCHEMA.KEY_COLUMN_USAGE 风格 TABLE_NAME / COLUMN_NAME /
 * REFERENCED_TABLE_NAME / REFERENCED_COLUMN_NAME（调用方按 CONSTRAINT_NAME, ORDINAL_POSITION 排序）。
 * 仅保留两端均在 {@code originToDisplay} 中的外键；按 from/to 去重。复合 FK 拆成多条单字段边（保序）。
 *
 * @author erdonline
 */
public final class ForeignKeyAssociationMapper {

    private ForeignKeyAssociationMapper() {
    }

    /**
     * @param importedKeysRs JDBC getImportedKeys ResultSet
     * @param originToDisplay 原表名（大小写不敏感键）→ 展示名（已做 nameCase）
     * @param nameCaseFlag    字段名大小写策略
     */
    public static List<Association> mapImportedKeys(ResultSet importedKeysRs,
                                                    Map<String, String> originToDisplay,
                                                    String nameCaseFlag) throws SQLException {
        return mapRows(importedKeysRs, originToDisplay, nameCaseFlag,
                "FKTABLE_NAME", "FKCOLUMN_NAME", "PKTABLE_NAME", "PKCOLUMN_NAME");
    }

    /**
     * MySQL / 字典 SQL：KEY_COLUMN_USAGE（及同类）列名。
     */
    public static List<Association> mapFromKeyColumnUsage(ResultSet keyColumnUsageRs,
                                                          Map<String, String> originToDisplay,
                                                          String nameCaseFlag) throws SQLException {
        return mapRows(keyColumnUsageRs, originToDisplay, nameCaseFlag,
                "TABLE_NAME", "COLUMN_NAME", "REFERENCED_TABLE_NAME", "REFERENCED_COLUMN_NAME");
    }

    private static List<Association> mapRows(ResultSet rs,
                                             Map<String, String> originToDisplay,
                                             String nameCaseFlag,
                                             String fkTableCol,
                                             String fkColumnCol,
                                             String pkTableCol,
                                             String pkColumnCol) throws SQLException {
        Set<String> seen = new LinkedHashSet<>(32);
        List<Association> associations = new ArrayList<>(16);
        while (rs.next()) {
            String fkTable = readString(rs, fkTableCol);
            String fkColumn = readString(rs, fkColumnCol);
            String pkTable = readString(rs, pkTableCol);
            String pkColumn = readString(rs, pkColumnCol);
            if (fkTable == null || fkColumn == null || pkTable == null || pkColumn == null) {
                continue;
            }
            String fromEntity = originToDisplay.get(fkTable.toUpperCase(Locale.ROOT));
            String toEntity = originToDisplay.get(pkTable.toUpperCase(Locale.ROOT));
            if (fromEntity == null || toEntity == null) {
                continue;
            }
            String fromField = NameCaseAdjuster.adjust(fkColumn, nameCaseFlag);
            String toField = NameCaseAdjuster.adjust(pkColumn, nameCaseFlag);
            String dedupeKey = fromEntity + '\0' + fromField + '\0' + toEntity + '\0' + toField;
            if (!seen.add(dedupeKey)) {
                continue;
            }
            associations.add(new Association(
                    Association.RELATION_ONE_TO_MANY,
                    new AssociationEnd(fromEntity, fromField),
                    new AssociationEnd(toEntity, toField)));
        }
        return associations;
    }

    private static String readString(ResultSet rs, String column) throws SQLException {
        try {
            return rs.getString(column);
        } catch (SQLException ex) {
            // 部分驱动/别名大小写不同
            return rs.getString(column.toLowerCase(Locale.ROOT));
        }
    }
}
