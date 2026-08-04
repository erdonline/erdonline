package com.erdonline.erd.schema;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.AssociationEnd;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.Module;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.DefaultValueMapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Builds normalized {@link SchemaFingerprint} from reverse IR or projectJSON.
 */
public final class SchemaFingerprintBuilder {

    private static final Set<String> IGNORED_TABLES = Set.of(
            "DB_VERSION",
            "PDMAN_DB_VERSION"
    );

    private SchemaFingerprintBuilder() {
    }

    public static SchemaFingerprint fromParseDataModel(ParseDataModel dataModel) {
        SchemaFingerprint fingerprint = new SchemaFingerprint();
        if (dataModel == null || dataModel.getModule() == null) {
            return fingerprint;
        }
        Module module = dataModel.getModule();
        if (module.getEntities() != null) {
            for (Entity entity : module.getEntities()) {
                if (entity == null || isIgnoredTable(entity.getTitle())) {
                    continue;
                }
                fingerprint.getTables().add(toTable(entity));
            }
        }
        if (module.getAssociations() != null) {
            for (Association association : module.getAssociations()) {
                SchemaForeignKeyFingerprint fk = toForeignKey(association);
                if (fk != null) {
                    fingerprint.getForeignKeys().add(fk);
                }
            }
        }
        sortFingerprint(fingerprint);
        return fingerprint;
    }

    @SuppressWarnings("unchecked")
    public static SchemaFingerprint fromProjectJson(Map<String, Object> projectJson) {
        SchemaFingerprint fingerprint = new SchemaFingerprint();
        if (projectJson == null) {
            return fingerprint;
        }
        Object modulesObj = projectJson.get("modules");
        if (!(modulesObj instanceof List<?> modules)) {
            return fingerprint;
        }
        for (Object moduleObj : modules) {
            if (!(moduleObj instanceof Map<?, ?> module)) {
                continue;
            }
            Object entitiesObj = module.get("entities");
            if (entitiesObj instanceof List<?> entities) {
                for (Object entityObj : entities) {
                    if (!(entityObj instanceof Map<?, ?> entityMap)) {
                        continue;
                    }
                    String title = stringVal(entityMap.get("title"));
                    if (title == null || isIgnoredTable(title)) {
                        continue;
                    }
                    fingerprint.getTables().add(toTableFromMap(title, entityMap));
                }
            }
            Object associationsObj = module.get("associations");
            if (associationsObj instanceof List<?> associations) {
                for (Object assocObj : associations) {
                    if (!(assocObj instanceof Map<?, ?> assocMap)) {
                        continue;
                    }
                    SchemaForeignKeyFingerprint fk = toForeignKeyFromMap(assocMap);
                    if (fk != null) {
                        fingerprint.getForeignKeys().add(fk);
                    }
                }
            }
        }
        sortFingerprint(fingerprint);
        return fingerprint;
    }

    private static SchemaTableFingerprint toTable(Entity entity) {
        SchemaTableFingerprint table = new SchemaTableFingerprint();
        table.setName(normalizeIdent(entity.getTitle()));
        if (entity.getFields() != null) {
            for (Field field : entity.getFields()) {
                if (field == null || field.getName() == null) {
                    continue;
                }
                SchemaColumnFingerprint col = new SchemaColumnFingerprint();
                col.setName(normalizeIdent(field.getName()));
                col.setType(normalizeType(field.getType()));
                col.setPk(field.isPk());
                col.setNotNull(field.isNotNull());
                col.setAutoIncrement(field.isAutoIncrement());
                col.setDefaultValue(normalizeDefault(field.getDefaultValue()));
                table.getColumns().add(col);
            }
        }
        if (entity.getIndexs() != null) {
            for (Index index : entity.getIndexs()) {
                if (index == null) {
                    continue;
                }
                table.getIndexes().add(toIndex(index));
            }
        }
        sortTable(table);
        return table;
    }

    @SuppressWarnings("unchecked")
    private static SchemaTableFingerprint toTableFromMap(String title, Map<?, ?> entityMap) {
        SchemaTableFingerprint table = new SchemaTableFingerprint();
        table.setName(normalizeIdent(title));
        Object fieldsObj = entityMap.get("fields");
        if (fieldsObj instanceof List<?> fields) {
            for (Object fieldObj : fields) {
                if (!(fieldObj instanceof Map<?, ?> fieldMap)) {
                    continue;
                }
                String name = stringVal(fieldMap.get("name"));
                if (name == null) {
                    continue;
                }
                SchemaColumnFingerprint col = new SchemaColumnFingerprint();
                col.setName(normalizeIdent(name));
                col.setType(normalizeType(stringVal(fieldMap.get("type"))));
                col.setPk(booleanVal(fieldMap.get("pk")));
                col.setNotNull(booleanVal(fieldMap.get("notNull")));
                col.setAutoIncrement(booleanVal(fieldMap.get("autoIncrement")));
                col.setDefaultValue(normalizeDefault(stringVal(fieldMap.get("defaultValue"))));
                table.getColumns().add(col);
            }
        }
        Object indexsObj = entityMap.get("indexs");
        if (indexsObj instanceof List<?> indexs) {
            for (Object indexObj : indexs) {
                if (!(indexObj instanceof Map<?, ?> indexMap)) {
                    continue;
                }
                SchemaIndexFingerprint index = new SchemaIndexFingerprint();
                index.setName(normalizeIdent(stringVal(indexMap.get("name"))));
                index.setUnique(booleanVal(indexMap.get("isUnique")));
                index.setFilter(blankToNull(stringVal(indexMap.get("filter"))));
                Object fieldsInIndex = indexMap.get("fields");
                if (fieldsInIndex instanceof List<?> fieldNames) {
                    List<String> names = new ArrayList<>(fieldNames.size());
                    for (Object fn : fieldNames) {
                        if (fn != null) {
                            names.add(normalizeIdent(String.valueOf(fn)));
                        }
                    }
                    names.sort(Comparator.naturalOrder());
                    index.setFields(names);
                }
                table.getIndexes().add(index);
            }
        }
        sortTable(table);
        return table;
    }

    private static SchemaIndexFingerprint toIndex(Index index) {
        SchemaIndexFingerprint fp = new SchemaIndexFingerprint();
        fp.setName(normalizeIdent(index.getName()));
        fp.setUnique(index.isUnique());
        fp.setFilter(blankToNull(index.getFilter()));
        if (index.getFields() != null) {
            List<String> fields = new ArrayList<>(index.getFields().size());
            for (String field : index.getFields()) {
                if (field != null) {
                    fields.add(normalizeIdent(field));
                }
            }
            fields.sort(Comparator.naturalOrder());
            fp.setFields(fields);
        }
        return fp;
    }

    private static SchemaForeignKeyFingerprint toForeignKey(Association association) {
        if (association == null || association.getFrom() == null || association.getTo() == null) {
            return null;
        }
        AssociationEnd from = association.getFrom();
        AssociationEnd to = association.getTo();
        if (from.getEntity() == null || from.getField() == null || to.getEntity() == null || to.getField() == null) {
            return null;
        }
        SchemaForeignKeyFingerprint fk = new SchemaForeignKeyFingerprint();
        fk.setFromTable(normalizeIdent(from.getEntity()));
        fk.setFromColumn(normalizeIdent(from.getField()));
        fk.setToTable(normalizeIdent(to.getEntity()));
        fk.setToColumn(normalizeIdent(to.getField()));
        fk.setConstraintName(blankToNull(association.getConstraintName()));
        fk.setDeleteRule(blankToNull(association.getDeleteRule()));
        fk.setUpdateRule(blankToNull(association.getUpdateRule()));
        return fk;
    }

    @SuppressWarnings("unchecked")
    private static SchemaForeignKeyFingerprint toForeignKeyFromMap(Map<?, ?> assocMap) {
        Object fromObj = assocMap.get("from");
        Object toObj = assocMap.get("to");
        if (!(fromObj instanceof Map<?, ?> from) || !(toObj instanceof Map<?, ?> to)) {
            return null;
        }
        String fromEntity = stringVal(from.get("entity"));
        String fromField = stringVal(from.get("field"));
        String toEntity = stringVal(to.get("entity"));
        String toField = stringVal(to.get("field"));
        if (fromEntity == null || fromField == null || toEntity == null || toField == null) {
            return null;
        }
        SchemaForeignKeyFingerprint fk = new SchemaForeignKeyFingerprint();
        fk.setFromTable(normalizeIdent(fromEntity));
        fk.setFromColumn(normalizeIdent(fromField));
        fk.setToTable(normalizeIdent(toEntity));
        fk.setToColumn(normalizeIdent(toField));
        fk.setConstraintName(blankToNull(stringVal(assocMap.get("constraintName"))));
        fk.setDeleteRule(blankToNull(stringVal(assocMap.get("deleteRule"))));
        fk.setUpdateRule(blankToNull(stringVal(assocMap.get("updateRule"))));
        return fk;
    }

    static void sortFingerprint(SchemaFingerprint fingerprint) {
        fingerprint.getTables().sort(Comparator.comparing(SchemaTableFingerprint::getName, Comparator.nullsLast(String::compareTo)));
        for (SchemaTableFingerprint table : fingerprint.getTables()) {
            sortTable(table);
        }
        fingerprint.getForeignKeys().sort(
                Comparator.comparing(SchemaForeignKeyFingerprint::getFromTable, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SchemaForeignKeyFingerprint::getFromColumn, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SchemaForeignKeyFingerprint::getToTable, Comparator.nullsLast(String::compareTo))
                        .thenComparing(SchemaForeignKeyFingerprint::getToColumn, Comparator.nullsLast(String::compareTo))
        );
    }

    private static void sortTable(SchemaTableFingerprint table) {
        table.getColumns().sort(Comparator.comparing(SchemaColumnFingerprint::getName, Comparator.nullsLast(String::compareTo)));
        table.getIndexes().sort(Comparator.comparing(SchemaIndexFingerprint::getName, Comparator.nullsLast(String::compareTo)));
        for (SchemaIndexFingerprint index : table.getIndexes()) {
            if (index.getFields() != null) {
                index.getFields().sort(Comparator.naturalOrder());
            }
        }
    }

    static String normalizeIdent(String raw) {
        if (raw == null) {
            return null;
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    static String normalizeType(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        return raw.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    static String normalizeDefault(String raw) {
        String normalized = DefaultValueMapper.normalizeJdbcColumnDef(raw);
        if (normalized == null) {
            return "";
        }
        return normalized.trim();
    }

    private static boolean isIgnoredTable(String title) {
        if (title == null) {
            return true;
        }
        return IGNORED_TABLES.contains(title.trim().toUpperCase(Locale.ROOT));
    }

    private static String stringVal(Object obj) {
        if (obj == null) {
            return null;
        }
        String s = String.valueOf(obj).trim();
        return s.isEmpty() ? null : s;
    }

    private static boolean booleanVal(Object obj) {
        if (obj instanceof Boolean b) {
            return b;
        }
        if (obj == null) {
            return false;
        }
        return Boolean.parseBoolean(String.valueOf(obj));
    }

    private static String blankToNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }
}
