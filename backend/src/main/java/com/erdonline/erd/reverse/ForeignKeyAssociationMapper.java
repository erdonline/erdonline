package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.AssociationEnd;

import java.sql.DatabaseMetaData;
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
 * <p>JDBC：{@code getImportedKeys} 列 FKTABLE_NAME / FKCOLUMN_NAME / PKTABLE_NAME / PKCOLUMN_NAME /
 * FK_NAME / DELETE_RULE / UPDATE_RULE。
 * <p>字典：INFORMATION_SCHEMA.KEY_COLUMN_USAGE 风格 TABLE_NAME / COLUMN_NAME /
 * REFERENCED_TABLE_NAME / REFERENCED_COLUMN_NAME（调用方按 CONSTRAINT_NAME, ORDINAL_POSITION 排序）；
 * 可选 CONSTRAINT_NAME / DELETE_RULE / UPDATE_RULE。
 * 仅保留两端均在 {@code originToDisplay} 中的外键；按 from/to 去重。复合 FK 拆成多条单字段边（保序），
 * 同约束行共享约束名与 ON DELETE/UPDATE（ADR-0011：不聚合为 fields[]）。
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
        return mapRows(importedKeysRs, originToDisplay, nameCaseFlag, true,
                "FKTABLE_NAME", "FKCOLUMN_NAME", "PKTABLE_NAME", "PKCOLUMN_NAME");
    }

    /**
     * MySQL / 字典 SQL：KEY_COLUMN_USAGE（及同类）列名。
     */
    public static List<Association> mapFromKeyColumnUsage(ResultSet keyColumnUsageRs,
                                                          Map<String, String> originToDisplay,
                                                          String nameCaseFlag) throws SQLException {
        return mapRows(keyColumnUsageRs, originToDisplay, nameCaseFlag, false,
                "TABLE_NAME", "COLUMN_NAME", "REFERENCED_TABLE_NAME", "REFERENCED_COLUMN_NAME");
    }

    private static List<Association> mapRows(ResultSet rs,
                                             Map<String, String> originToDisplay,
                                             String nameCaseFlag,
                                             boolean jdbcImportedKeys,
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
            Association association = new Association(
                    Association.RELATION_ONE_TO_MANY,
                    new AssociationEnd(fromEntity, fromField),
                    new AssociationEnd(toEntity, toField));
            association.setConstraintName(resolveConstraintName(rs, jdbcImportedKeys));
            association.setDeleteRule(resolveDeleteRule(rs, jdbcImportedKeys));
            association.setUpdateRule(resolveUpdateRule(rs, jdbcImportedKeys));
            associations.add(association);
        }
        return associations;
    }

    private static String resolveConstraintName(ResultSet rs, boolean jdbcImportedKeys) {
        if (jdbcImportedKeys) {
            return blankToNull(readOptionalString(rs, "FK_NAME", "fk_name"));
        }
        return blankToNull(readOptionalString(rs, "CONSTRAINT_NAME", "constraint_name"));
    }

    private static String resolveDeleteRule(ResultSet rs, boolean jdbcImportedKeys) {
        if (jdbcImportedKeys) {
            return mapJdbcRule(readOptionalShort(rs, "DELETE_RULE", "delete_rule"));
        }
        return normalizeRule(readOptionalString(rs, "DELETE_RULE", "delete_rule"));
    }

    private static String resolveUpdateRule(ResultSet rs, boolean jdbcImportedKeys) {
        if (jdbcImportedKeys) {
            return mapJdbcRule(readOptionalShort(rs, "UPDATE_RULE", "update_rule"));
        }
        return normalizeRule(readOptionalString(rs, "UPDATE_RULE", "update_rule"));
    }

    /**
     * 统一字典/驱动写法：CASCADE、SET NULL、SET DEFAULT、RESTRICT、NO ACTION。
     */
    static String normalizeRule(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String upper = trimmed.toUpperCase(Locale.ROOT).replace('_', ' ').replaceAll("\\s+", " ");
        switch (upper) {
            case "CASCADE":
                return "CASCADE";
            case "SET NULL":
                return "SET NULL";
            case "SET DEFAULT":
                return "SET DEFAULT";
            case "RESTRICT":
                return "RESTRICT";
            case "NO ACTION":
            case "NONE":
                return "NO ACTION";
            default:
                return upper;
        }
    }

    static String mapJdbcRule(Short rule) {
        if (rule == null) {
            return null;
        }
        switch (rule) {
            case DatabaseMetaData.importedKeyCascade:
                return "CASCADE";
            case DatabaseMetaData.importedKeyRestrict:
                return "RESTRICT";
            case DatabaseMetaData.importedKeySetNull:
                return "SET NULL";
            case DatabaseMetaData.importedKeyNoAction:
                return "NO ACTION";
            case DatabaseMetaData.importedKeySetDefault:
                return "SET DEFAULT";
            default:
                return null;
        }
    }

    private static String readString(ResultSet rs, String column) throws SQLException {
        try {
            return rs.getString(column);
        } catch (SQLException ex) {
            return rs.getString(column.toLowerCase(Locale.ROOT));
        }
    }

    private static String readOptionalString(ResultSet rs, String... columns) {
        for (String column : columns) {
            try {
                String value = rs.getString(column);
                if (value != null && !value.trim().isEmpty()) {
                    return value.trim();
                }
            } catch (SQLException ignored) {
                // 旧 SQL / 驱动无此列
            }
        }
        return null;
    }

    private static Short readOptionalShort(ResultSet rs, String... columns) {
        for (String column : columns) {
            try {
                short value = rs.getShort(column);
                if (!rs.wasNull()) {
                    return value;
                }
            } catch (SQLException ignored) {
                // 旧驱动无此列
            }
        }
        return null;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        return value;
    }
}
