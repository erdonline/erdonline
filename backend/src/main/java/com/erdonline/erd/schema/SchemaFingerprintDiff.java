package com.erdonline.erd.schema;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Structural IR diff for B-layer five-state classification (ADR-0022 #10).
 */
public final class SchemaFingerprintDiff {

    private SchemaFingerprintDiff() {
    }

    public static SchemaProbeStatus classify(SchemaFingerprint live, SchemaFingerprint model) {
        if (live == null || model == null) {
            return SchemaProbeStatus.UNKNOWN;
        }

        boolean modelOnly = false;
        boolean liveOnly = false;
        boolean modified = false;

        Map<String, SchemaTableFingerprint> liveTables = indexTables(live.getTables());
        Map<String, SchemaTableFingerprint> modelTables = indexTables(model.getTables());

        for (String name : modelTables.keySet()) {
            if (!liveTables.containsKey(name)) {
                modelOnly = true;
            }
        }
        for (String name : liveTables.keySet()) {
            if (!modelTables.containsKey(name)) {
                liveOnly = true;
            }
        }
        for (String name : modelTables.keySet()) {
            SchemaTableFingerprint liveTable = liveTables.get(name);
            if (liveTable == null) {
                continue;
            }
            TableSliceDiff slice = diffTable(modelTables.get(name), liveTable);
            modelOnly |= slice.modelOnly;
            liveOnly |= slice.liveOnly;
            modified |= slice.modified;
        }

        FkSliceDiff fkSlice = diffForeignKeys(live.getForeignKeys(), model.getForeignKeys());
        modelOnly |= fkSlice.modelOnly;
        liveOnly |= fkSlice.liveOnly;
        modified |= fkSlice.modified;

        if (!modelOnly && !liveOnly && !modified) {
            return SchemaProbeStatus.SYNCED;
        }
        if (modified || (modelOnly && liveOnly)) {
            return SchemaProbeStatus.DIVERGED;
        }
        if (modelOnly) {
            return SchemaProbeStatus.AHEAD;
        }
        return SchemaProbeStatus.BEHIND;
    }

    private static Map<String, SchemaTableFingerprint> indexTables(List<SchemaTableFingerprint> tables) {
        Map<String, SchemaTableFingerprint> map = new HashMap<>();
        if (tables == null) {
            return map;
        }
        for (SchemaTableFingerprint table : tables) {
            if (table == null || table.getName() == null) {
                continue;
            }
            map.put(normalizeKey(table.getName()), table);
        }
        return map;
    }

    private static TableSliceDiff diffTable(SchemaTableFingerprint model, SchemaTableFingerprint live) {
        boolean modelOnly = false;
        boolean liveOnly = false;
        boolean modified = false;

        Map<String, SchemaColumnFingerprint> liveCols = indexColumns(live.getColumns());
        Map<String, SchemaColumnFingerprint> modelCols = indexColumns(model.getColumns());

        for (Map.Entry<String, SchemaColumnFingerprint> entry : modelCols.entrySet()) {
            SchemaColumnFingerprint liveCol = liveCols.get(entry.getKey());
            if (liveCol == null) {
                modelOnly = true;
            } else if (!entry.getValue().equals(liveCol)) {
                modified = true;
            }
        }
        for (String name : liveCols.keySet()) {
            if (!modelCols.containsKey(name)) {
                liveOnly = true;
            }
        }

        Map<String, SchemaIndexFingerprint> liveIdx = indexIndexes(live.getIndexes());
        Map<String, SchemaIndexFingerprint> modelIdx = indexIndexes(model.getIndexes());

        for (Map.Entry<String, SchemaIndexFingerprint> entry : modelIdx.entrySet()) {
            SchemaIndexFingerprint liveIndex = liveIdx.get(entry.getKey());
            if (liveIndex == null) {
                modelOnly = true;
            } else if (!entry.getValue().equals(liveIndex)) {
                modified = true;
            }
        }
        for (String name : liveIdx.keySet()) {
            if (!modelIdx.containsKey(name)) {
                liveOnly = true;
            }
        }

        return new TableSliceDiff(modelOnly, liveOnly, modified);
    }

    private static Map<String, SchemaColumnFingerprint> indexColumns(List<SchemaColumnFingerprint> columns) {
        Map<String, SchemaColumnFingerprint> map = new HashMap<>();
        if (columns == null) {
            return map;
        }
        for (SchemaColumnFingerprint column : columns) {
            if (column == null || column.getName() == null) {
                continue;
            }
            map.put(normalizeKey(column.getName()), column);
        }
        return map;
    }

    private static Map<String, SchemaIndexFingerprint> indexIndexes(List<SchemaIndexFingerprint> indexes) {
        Map<String, SchemaIndexFingerprint> map = new HashMap<>();
        if (indexes == null) {
            return map;
        }
        for (SchemaIndexFingerprint index : indexes) {
            if (index == null || index.getName() == null) {
                continue;
            }
            map.put(normalizeKey(index.getName()), index);
        }
        return map;
    }

    private static FkSliceDiff diffForeignKeys(List<SchemaForeignKeyFingerprint> live,
                                               List<SchemaForeignKeyFingerprint> model) {
        Set<String> liveKeys = fkKeys(live);
        Set<String> modelKeys = fkKeys(model);

        boolean modelOnly = false;
        boolean liveOnly = false;
        for (String key : modelKeys) {
            if (!liveKeys.contains(key)) {
                modelOnly = true;
            }
        }
        for (String key : liveKeys) {
            if (!modelKeys.contains(key)) {
                liveOnly = true;
            }
        }
        return new FkSliceDiff(modelOnly, liveOnly, false);
    }

    private static Set<String> fkKeys(List<SchemaForeignKeyFingerprint> fks) {
        Set<String> keys = new HashSet<>();
        if (fks == null) {
            return keys;
        }
        for (SchemaForeignKeyFingerprint fk : fks) {
            if (fk == null) {
                continue;
            }
            keys.add(fkKey(fk));
        }
        return keys;
    }

    private static String fkKey(SchemaForeignKeyFingerprint fk) {
        return normalizeKey(fk.getFromTable()) + '|'
                + normalizeKey(fk.getFromColumn()) + '|'
                + normalizeKey(fk.getToTable()) + '|'
                + normalizeKey(fk.getToColumn()) + '|'
                + normalizeKey(fk.getConstraintName());
    }

    private static String normalizeKey(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private record TableSliceDiff(boolean modelOnly, boolean liveOnly, boolean modified) {
    }

    private record FkSliceDiff(boolean modelOnly, boolean liveOnly, boolean modified) {
    }
}
