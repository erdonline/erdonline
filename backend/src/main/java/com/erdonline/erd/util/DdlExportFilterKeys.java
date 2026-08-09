package com.erdonline.erd.util;

import java.util.List;
import java.util.Set;

/**
 * 全量 DDL 导出片段键，与前端 exportSlice customType 对齐。
 */
public final class DdlExportFilterKeys {

    public static final String DELETE_TABLE = "deleteTable";
    public static final String CREATE_TABLE = "createTable";
    public static final String CREATE_INDEX = "createIndex";
    public static final String CREATE_TRIGGER = "createTrigger";
    public static final String CREATE_FOREIGN_KEY = "createForeignKey";
    public static final String UPDATE_COMMENT = "updateComment";

    private static final List<String> ALL = List.of(
            DELETE_TABLE,
            CREATE_TABLE,
            CREATE_INDEX,
            CREATE_TRIGGER,
            CREATE_FOREIGN_KEY,
            UPDATE_COMMENT);

    private static final Set<String> KNOWN = Set.copyOf(ALL);

    private DdlExportFilterKeys() {
    }

    public static List<String> allSegments() {
        return ALL;
    }

    public static boolean isKnown(String key) {
        return key != null && KNOWN.contains(key);
    }
}
