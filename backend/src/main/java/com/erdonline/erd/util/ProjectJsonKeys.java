package com.erdonline.erd.util;

/**
 * projectJSON 顶层与 profile / dataTypeDomains 字段名（单一真相源，禁止散落 magic string）。
 */
public final class ProjectJsonKeys {

    public static final String MODULES = "modules";
    public static final String PROFILE = "profile";
    public static final String DATA_TYPE_DOMAINS = "dataTypeDomains";
    public static final String DATATYPE = "datatype";
    public static final String DATABASE = "database";

    public static final String SQL_CONFIG = "sqlConfig";
    public static final String DEFAULT_DATABASE = "defaultDatabase";
    public static final String CODE = "code";

    public static final String NAME = "name";
    public static final String TITLE = "title";
    public static final String ENTITIES = "entities";
    public static final String ASSOCIATIONS = "associations";
    public static final String FIELDS = "fields";
    public static final String INDEXS = "indexs";
    public static final String TRIGGERS = "triggers";

    public static final String TYPE = "type";
    public static final String APPLY = "apply";
    public static final String CHNNAME = "chnname";
    public static final String REMARK = "remark";

    private ProjectJsonKeys() {
    }
}
