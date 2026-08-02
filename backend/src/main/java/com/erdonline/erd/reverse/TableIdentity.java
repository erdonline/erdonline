package com.erdonline.erd.reverse;

/**
 * 逆向过程中的表标识：库内原始名 + 展示名 + 备注。
 *
 * @author erdonline
 */
public class TableIdentity {

    private final String catalog;
    private final String schema;
    private final String originTableName;
    private final String displayTableName;
    private final String remarks;

    public TableIdentity(String catalog, String schema, String originTableName,
                         String displayTableName, String remarks) {
        this.catalog = catalog;
        this.schema = schema;
        this.originTableName = originTableName;
        this.displayTableName = displayTableName;
        this.remarks = remarks;
    }

    public String getCatalog() {
        return catalog;
    }

    public String getSchema() {
        return schema;
    }

    public String getOriginTableName() {
        return originTableName;
    }

    public String getDisplayTableName() {
        return displayTableName;
    }

    public String getRemarks() {
        return remarks;
    }

    /**
     * 以字典注释回填后的不可变副本（catalog/schema/表名不变）。
     */
    public TableIdentity withRemarks(String newRemarks) {
        return new TableIdentity(catalog, schema, originTableName, displayTableName, newRemarks);
    }
}
