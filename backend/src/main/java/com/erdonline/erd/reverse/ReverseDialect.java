package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.ParseDataModel;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

/**
 * 多库逆向方言 SPI。热库实现字典 SQL；Generic 走 JDBC 兜底。
 *
 * @author erdonline
 */
public interface ReverseDialect {

    /**
     * @return 方言标识，见 {@link DialectIds}
     */
    String id();

    /**
     * 是否认领该 JDBC DatabaseMetaData#getDatabaseProductName。
     */
    boolean supports(String productName);

    /**
     * 能力矩阵。
     */
    DialectCapability capability();

    /**
     * 列出 schema（不支持时返回空列表）。
     */
    default List<String> listSchemas(Connection connection) throws SQLException {
        return Collections.emptyList();
    }

    /**
     * 列出表（不含系统噪音表）。
     *
     * @param schema 可选；MySQL 下通常为 null（用 catalog）
     * @param nameCaseFlag DEFAULT / LOWCASE / UPPERCASE
     */
    List<TableIdentity> listTables(Connection connection, String schema, String nameCaseFlag) throws SQLException;

    /**
     * 填充单表字段、主键、索引等到 {@link Entity}。
     */
    void fillEntity(Connection connection, TableIdentity table, Entity entity,
                    ParseDataModel dataModel, String nameCaseFlag) throws SQLException;
}
