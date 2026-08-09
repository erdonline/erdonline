package com.erdonline.erd.util;

/**
 * {@link VersionDiffEngine} 产出 changes 条目的键名与 type/opt 枚举值。
 */
public final class VersionDiffKeys {

    public static final String TYPE = "type";
    public static final String OPT = "opt";
    public static final String NAME = "name";
    public static final String CHANGE_DATA = "changeData";

    public static final String TYPE_ENTITY = "entity";
    public static final String TYPE_FIELD = "field";
    public static final String TYPE_INDEX = "index";
    public static final String TYPE_ASSOCIATION = "association";
    public static final String TYPE_PROFILE = "profile";
    public static final String TYPE_DATATYPE = "datatype";
    public static final String TYPE_DIAGRAM = "diagram";

    public static final String OPT_ADD = "add";
    public static final String OPT_UPDATE = "update";
    public static final String OPT_DELETE = "delete";
    public static final String OPT_REBUILD = "rebuild";

    private VersionDiffKeys() {
    }
}
