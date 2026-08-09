package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * association → ALTER TABLE … FOREIGN KEY（与前端 json2code FK 导出对齐）。
 */
public final class DdlForeignKeyRenderer {

    private DdlForeignKeyRenderer() {
    }

    public record ForeignKeyGroup(
            String constraintName,
            String fromEntity,
            String toEntity,
            List<String> fromFields,
            List<String> toFields,
            String deleteRule,
            String updateRule) {
    }

    public static List<ForeignKeyGroup> groupAssociationsForFk(List<Map<String, Object>> associations) {
        List<ForeignKeyGroup> groups = new ArrayList<>();
        Map<String, Integer> namedIndex = new LinkedHashMap<>();
        for (Map<String, Object> a : associations != null ? associations : List.<Map<String, Object>>of()) {
            Map<String, Object> from = ProjectJsonSupport.asMap(a.get("from"));
            Map<String, Object> to = ProjectJsonSupport.asMap(a.get("to"));
            String fromEntity = ProjectJsonSupport.str(from.get("entity"));
            String toEntity = ProjectJsonSupport.str(to.get("entity"));
            String fromField = ProjectJsonSupport.str(from.get("field"));
            String toField = ProjectJsonSupport.str(to.get("field"));
            if (fromEntity.isEmpty() || toEntity.isEmpty() || fromField.isEmpty() || toField.isEmpty()) {
                continue;
            }
            String deleteRule = DdlDialectSupport.normalizeFkRuleForSql(a.get("deleteRule"));
            String updateRule = DdlDialectSupport.normalizeFkRuleForSql(a.get("updateRule"));
            String cName = ProjectJsonSupport.str(a.get("constraintName")).trim();
            if (!cName.isEmpty()) {
                String key = cName + "\0" + fromEntity + "\0" + toEntity;
                Integer idx = namedIndex.get(key);
                if (idx != null) {
                    ForeignKeyGroup g = groups.get(idx);
                    List<String> ff = new ArrayList<>(g.fromFields());
                    List<String> tf = new ArrayList<>(g.toFields());
                    if (!ff.contains(fromField)) {
                        ff.add(fromField);
                    }
                    if (!tf.contains(toField)) {
                        tf.add(toField);
                    }
                    groups.set(idx, new ForeignKeyGroup(
                            g.constraintName(), g.fromEntity(), g.toEntity(), ff, tf,
                            g.deleteRule() != null ? g.deleteRule() : deleteRule,
                            g.updateRule() != null ? g.updateRule() : updateRule));
                    continue;
                }
                namedIndex.put(key, groups.size());
                groups.add(new ForeignKeyGroup(
                        cName, fromEntity, toEntity,
                        new ArrayList<>(List.of(fromField)),
                        new ArrayList<>(List.of(toField)),
                        deleteRule, updateRule));
                continue;
            }
            groups.add(new ForeignKeyGroup(
                    null, fromEntity, toEntity,
                    new ArrayList<>(List.of(fromField)),
                    new ArrayList<>(List.of(toField)),
                    deleteRule, updateRule));
        }
        return groups;
    }

    public static String rebuildForeignKeyDdl(ForeignKeyGroup fk, String dialectCode) {
        String fromEntity = ProjectJsonSupport.str(fk.fromEntity()).trim();
        String toEntity = ProjectJsonSupport.str(fk.toEntity()).trim();
        List<String> fromFields = fk.fromFields().stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
        List<String> toFields = fk.toFields().stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (fromEntity.isEmpty() || toEntity.isEmpty() || fromFields.isEmpty() || toFields.isEmpty()) {
            return "";
        }
        String name = ProjectJsonSupport.str(fk.constraintName()).trim();
        if (name.isEmpty()) {
            name = DdlDialectSupport.suggestFkConstraintName(fromEntity, fromFields, toEntity);
        }
        String cols = fromFields.stream().map(f -> DdlDialectSupport.quoteIdent(f, dialectCode))
                .reduce((a, b) -> a + ", " + b).orElse("");
        String refCols = toFields.stream().map(f -> DdlDialectSupport.quoteIdent(f, dialectCode))
                .reduce((a, b) -> a + ", " + b).orElse("");
        StringBuilder sql = new StringBuilder();
        sql.append("ALTER TABLE ").append(DdlDialectSupport.quoteIdent(fromEntity, dialectCode))
                .append(" ADD CONSTRAINT ").append(DdlDialectSupport.quoteIdent(name, dialectCode))
                .append(" FOREIGN KEY (").append(cols).append(")")
                .append(" REFERENCES ").append(DdlDialectSupport.quoteIdent(toEntity, dialectCode))
                .append(" (").append(refCols).append(")");
        String del = fk.deleteRule();
        String upd = fk.updateRule();
        if (del != null) {
            sql.append(" ON DELETE ").append(del);
        }
        if (upd != null && !Objects.equals(DdlDialectSupport.normalizeDialectCode(dialectCode), "oracle")) {
            sql.append(" ON UPDATE ").append(upd);
        }
        return sql.toString();
    }

    public static String renderCreateForeignKeySql(ForeignKeyGroup fk, String separator, String dialectCode) {
        if (!DdlDialectSupport.dialectSupportsForeignKey(dialectCode)) {
            return "";
        }
        String ddl = rebuildForeignKeyDdl(fk, dialectCode);
        if (ddl.isBlank()) {
            return "";
        }
        String stmt = ddl.matches(".*;\\s*$") ? ddl : ddl + ";";
        return stmt + (separator != null ? separator : "");
    }

    public static Map<String, Object> findAssociationByChangeName(Map<String, Object> dataSource, String changeName) {
        int dot = changeName.indexOf('.');
        if (dot <= 0) {
            return null;
        }
        String moduleName = changeName.substring(0, dot);
        String tail = changeName.substring(dot + 1);
        for (Map<String, Object> mod : ProjectJsonSupport.asMapList(dataSource.get(ProjectJsonKeys.MODULES))) {
            if (!Objects.equals(mod.get(ProjectJsonKeys.NAME), moduleName)) {
                continue;
            }
            for (Map<String, Object> a : ProjectJsonSupport.asMapList(mod.get(ProjectJsonKeys.ASSOCIATIONS))) {
                String key = VersionDiffEngine.associationKey(a);
                if (tail.equals(key) || tail.startsWith(key + ".")) {
                    return a;
                }
            }
        }
        return null;
    }
}
