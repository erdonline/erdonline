package com.erdonline.erd.util;

/**
 * projectJSON.dataTypeDomains.database[] 中方言 DDL 模板的键名。
 */
public final class DdlTemplateKeys {

    public static final String TEMPLATE = "template";
    public static final String CREATE_TABLE = "createTableTemplate";
    public static final String DELETE_TABLE = "deleteTableTemplate";
    public static final String REBUILD_TABLE = "rebuildTableTemplate";
    public static final String CREATE_FIELD = "createFieldTemplate";
    public static final String UPDATE_FIELD = "updateFieldTemplate";
    public static final String DELETE_FIELD = "deleteFieldTemplate";
    public static final String CREATE_PK = "createPkTemplate";
    public static final String DELETE_PK = "deletePkTemplate";
    public static final String CREATE_INDEX = "createIndexTemplate";
    public static final String DELETE_INDEX = "deleteIndexTemplate";
    public static final String UPDATE_TABLE_COMMENT = "updateTableComment";

    /** 模板上下文键 */
    public static final String CTX_ENTITY = "entity";
    public static final String CTX_OLD_ENTITY = "oldEntity";
    public static final String CTX_NEW_ENTITY = "newEntity";
    public static final String CTX_FIELD = "field";
    public static final String CTX_INDEX = "index";
    public static final String CTX_MODULE = "module";
    public static final String CTX_SEPARATOR = "separator";

    /** profile.sqlConfig 缺省值 */
    public static final String DEFAULT_SQL_SEPARATOR = "/*SQL@Run*/";

    private DdlTemplateKeys() {
    }
}
