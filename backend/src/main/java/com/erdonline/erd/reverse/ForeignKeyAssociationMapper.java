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
 * 将 JDBC {@code DatabaseMetaData#getImportedKeys} 行映射为 {@link Association}。
 * <p>约定列：FKTABLE_NAME / FKCOLUMN_NAME / PKTABLE_NAME / PKCOLUMN_NAME。
 * 仅保留两端均在 {@code originToDisplay} 中的外键；按 from/to 去重。
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
        Set<String> seen = new LinkedHashSet<>(32);
        List<Association> associations = new ArrayList<>(16);
        while (importedKeysRs.next()) {
            String fkTable = importedKeysRs.getString("FKTABLE_NAME");
            String fkColumn = importedKeysRs.getString("FKCOLUMN_NAME");
            String pkTable = importedKeysRs.getString("PKTABLE_NAME");
            String pkColumn = importedKeysRs.getString("PKCOLUMN_NAME");
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
}
