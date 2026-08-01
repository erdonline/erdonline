package com.erdonline.erd.reverse;

/**
 * 逆向方言标识常量（对齐产品侧 database.code / JDBC productName 归一化结果）。
 *
 * @author erdonline
 */
public final class DialectIds {

    public static final String MYSQL = "MYSQL";
    public static final String MARIADB = "MARIADB";
    public static final String POSTGRESQL = "POSTGRESQL";
    public static final String ORACLE = "ORACLE";
    public static final String SQLSERVER = "SQLSERVER";
    public static final String GENERIC = "GENERIC";

    private DialectIds() {
    }
}
